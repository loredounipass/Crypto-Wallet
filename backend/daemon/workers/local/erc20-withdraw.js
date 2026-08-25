const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker } = require(`${appRoot}/config/bullmq`)
const { Web3 } = require('web3')
const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
const { getTokenInfo } = require(`${appRoot}/config/tokens`)

const ERC20_ABI_TRANSFER = [
    {
        "constant": false,
        "inputs": [
            {"name": "to","type": "address"},
            {"name": "value","type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "","type": "bool"}],
        "type": "function"
    }
]

const ERC20_ABI_BALANCE = [
    {
        "constant": true,
        "inputs": [{"name": "account","type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "","type": "uint256"}],
        "type": "function"
    }
]

const WALLET_CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "address","name": "tokenAddress","type": "address"}],
        "name": "forwardToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]



// CONVIERTE UN VALOR DECIMAL LEGIBLE A SU REPRESENTACION CRUDA EN BASE A LOS DECIMALES DEL TOKEN
function toRawAmount(displayAmount, decimals) {
    const divisor = BigInt(10) ** BigInt(decimals)
    const parts = displayAmount.toString().split('.')
    const whole = BigInt(parts[0] || '0') * divisor
    const fraction = parts[1] ? BigInt(parts[1].padEnd(decimals, '0').slice(0, decimals)) : BigInt(0)
    return (whole + fraction).toString()
}



// REENVIA LOS TOKENS RECIBIDOS EN EL CONTRATO DE LA BILLETERA HACIA LA BILLETERA CALIENTE PRINCIPAL
async function forwardToHotWallet(web3, walletContractAddress, tokenAddress, relayerPk, chainId) {
    const walletContract = new web3.eth.Contract(WALLET_CONTRACT_ABI, walletContractAddress)
    const txData = walletContract.methods.forwardToken(tokenAddress).encodeABI()
    const gasPrice = await web3.eth.getGasPrice()
    const account = web3.eth.accounts.privateKeyToAccount(relayerPk)
    let gasEstimate
    try {
        gasEstimate = await web3.eth.estimateGas({
            from: account.address,
            to: walletContractAddress,
            data: txData
        })
    } catch {
        gasEstimate = 150000
    }
    const gasLimit = Math.ceil(gasEstimate * 1.2)
    const nonce = await web3.eth.getTransactionCount(account.address)
    const txObject = {
        from: account.address,
        to: walletContractAddress,
        nonce: web3.utils.toHex(nonce),
        gasPrice: web3.utils.toHex(gasPrice),
        gas: web3.utils.toHex(gasLimit),
        data: txData,
        chainId
    }
    const signedTx = await web3.eth.accounts.signTransaction(txObject, relayerPk)
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    console.log(`[ERC20-WITHDRAW] Forwarded tokens from ${walletContractAddress} to hot wallet. Tx: ${receipt.transactionHash}`)
}

connectDB.then(() => {
    console.log('[ERC20-WITHDRAW] Worker started and ready')
    new Worker('erc20-withdraw-requests', async (job) => {
        const { transactionId, walletAddress, tokenAddress, chainId, amount, withdrawAddress, symbol, deductLocked } = job.data
        console.log(`[ERC20-WITHDRAW] Processing withdrawal of ${amount} ${symbol} to ${withdrawAddress}`)
        const chainConfig = require(`${appRoot}/config/chains/${chainId}`)
        const rpcUrl = chainConfig.rpc
        const web3 = new Web3(rpcUrl)
        const hotWalletAddress = process.env.WITHDRAW_FROM_WALLET
        const hotWalletPk = process.env.WITHDRAW_FROM_PRIVATE_KEY
        if (!hotWalletAddress || !hotWalletPk) {
            throw new Error('WITHDRAW_FROM_WALLET or WITHDRAW_FROM_PRIVATE_KEY not configured')
        }
        const tokenInfo = getTokenInfo(tokenAddress)
        const decimals = tokenInfo?.decimals ?? 18
        const rawAmount = toRawAmount(amount, decimals)
        const tokenContract = new web3.eth.Contract(ERC20_ABI_BALANCE, tokenAddress)
        const hotWalletBalance = await tokenContract.methods.balanceOf(hotWalletAddress).call()
        if (BigInt(hotWalletBalance) < BigInt(rawAmount)) {
            console.log(`[ERC20-WITHDRAW] Hot wallet has insufficient balance. Forwarding from wallet contract ${walletAddress}...`)
            const relayerPk = process.env.RELAYER_PRIVATE_KEY
            if (!relayerPk) {
                throw new Error('RELAYER_PRIVATE_KEY not configured. Needed to forward tokens from wallet contract.')
            }
            await forwardToHotWallet(web3, walletAddress, tokenAddress, relayerPk, chainId)
        }
        const transferContract = new web3.eth.Contract(ERC20_ABI_TRANSFER, tokenAddress)
        const txData = transferContract.methods.transfer(withdrawAddress, rawAmount).encodeABI()
        const gasPrice = await web3.eth.getGasPrice()
        let gasEstimate
        try {
            gasEstimate = await web3.eth.estimateGas({
                from: hotWalletAddress,
                to: tokenAddress,
                data: txData
            })
        } catch {
            gasEstimate = 100000
        }
        const gasLimit = Math.ceil(gasEstimate * 1.2)
        const txObject = {
            from: hotWalletAddress,
            to: tokenAddress,
            nonce: web3.utils.toHex(await web3.eth.getTransactionCount(hotWalletAddress)),
            gasPrice: web3.utils.toHex(gasPrice),
            gas: web3.utils.toHex(gasLimit),
            data: txData,
            chainId
        }
        const signedTx = await web3.eth.accounts.signTransaction(txObject, hotWalletPk)
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        console.log(`[ERC20-WITHDRAW] ${symbol} withdrawal sent. Tx: ${receipt.transactionHash}`)
        const deduct = Math.min(amount, deductLocked || amount)
        await Erc20Ledger.updateOne(
            { walletAddress: walletAddress.toLowerCase(), tokenAddress: tokenAddress.toLowerCase(), chainId },
            { $inc: { available_balance: -amount, locked_for_forward: -deduct } }
        )
        const Transaction = require(`${appRoot}/config/models/Transaction`)
        await Transaction.updateOne(
            { _id: transactionId },
            {
                $set: {
                    txHash: receipt.transactionHash,
                    status: 3,
                    confirmations: 0
                }
            }
        )
        const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)
        await publishTransactionStatusUpdate({
            transactionId,
            status: 3,
            confirmations: 0,
            source: 'erc20-withdraw'
        })
        return receipt.transactionHash
    })
})
