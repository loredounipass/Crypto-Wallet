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

function toRawAmount(displayAmount, decimals) {
    const divisor = BigInt(10) ** BigInt(decimals)
    const parts = displayAmount.toString().split('.')
    const whole = BigInt(parts[0] || '0') * divisor
    const fraction = parts[1] ? BigInt(parts[1].padEnd(decimals, '0').slice(0, decimals)) : BigInt(0)
    return (whole + fraction).toString()
}

connectDB.then(() => {
    console.log('[ERC20-WITHDRAW] Worker started and ready')
    new Worker('erc20-withdraw-requests', async (job) => {
        const { transactionId, walletAddress, tokenAddress, chainId, amount, withdrawAddress, symbol } = job.data
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

        const tokenContract = new web3.eth.Contract(ERC20_ABI_TRANSFER, tokenAddress)
        const txData = tokenContract.methods.transfer(withdrawAddress, rawAmount).encodeABI()

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
