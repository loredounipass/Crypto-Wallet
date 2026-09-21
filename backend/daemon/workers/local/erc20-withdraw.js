const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker } = require(`${appRoot}/config/bullmq`)
const { Web3 } = require('web3')
const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
const { getTokenInfo } = require(`${appRoot}/config/tokens`)

const ensureHexPrefix = (hexStr) => hexStr.startsWith('0x') ? hexStr : `0x${hexStr}`

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
        gasEstimate = 150000n
    }
    const gasLimit = (BigInt(gasEstimate) * 120n) / 100n
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
        const hotWalletPkRaw = process.env.WITHDRAW_FROM_PRIVATE_KEY
        if (!hotWalletAddress || !hotWalletPkRaw) {
            throw new Error('WITHDRAW_FROM_WALLET or WITHDRAW_FROM_PRIVATE_KEY not configured')
        }
        const hotWalletPk = ensureHexPrefix(hotWalletPkRaw)
        
        const expectedAddress = web3.eth.accounts.privateKeyToAccount(hotWalletPk).address
        if (expectedAddress.toLowerCase() !== hotWalletAddress.toLowerCase()) {
            throw new Error(`CRITICAL MISMATCH: WITHDRAW_FROM_PRIVATE_KEY resolves to ${expectedAddress}, but WITHDRAW_FROM_WALLET is configured as ${hotWalletAddress}`)
        }

        const nativeBalance = await web3.eth.getBalance(hotWalletAddress)
        if (BigInt(nativeBalance) === 0n) {
            throw new Error(`Insufficient native balance. Hot wallet ${hotWalletAddress} has 0 native tokens to pay for gas.`)
        }
        const tokenInfo = getTokenInfo(chainId, tokenAddress)
        const decimals = tokenInfo?.decimals ?? 18
        const rawAmount = toRawAmount(amount, decimals)
        const tokenContract = new web3.eth.Contract(ERC20_ABI_BALANCE, tokenAddress)
        const hotWalletBalance = await tokenContract.methods.balanceOf(hotWalletAddress).call()
        if (BigInt(hotWalletBalance) < BigInt(rawAmount)) {
            console.log(`[ERC20-WITHDRAW] Hot wallet has insufficient balance. Forwarding from wallet contract ${walletAddress}...`)
            const relayerPkRaw = process.env.RELAYER_PRIVATE_KEY
            if (!relayerPkRaw) {
                throw new Error('RELAYER_PRIVATE_KEY not configured. Needed to forward tokens from wallet contract.')
            }
            const relayerPk = ensureHexPrefix(relayerPkRaw)
            await forwardToHotWallet(web3, walletAddress, tokenAddress, relayerPk, chainId)

            // Esperar a que el balance del forward sea visible en el nodo RPC
            // Esto evita el race condition donde transfer() revierte porque el nodo
            // aún no refleja el nuevo balance del hot wallet tras el forward
            const MAX_BALANCE_POLLS = 10
            const BALANCE_POLL_INTERVAL = 3000
            let balanceReady = false
            for (let i = 0; i < MAX_BALANCE_POLLS; i++) {
                const updatedBalance = await tokenContract.methods.balanceOf(hotWalletAddress).call()
                if (BigInt(updatedBalance) >= BigInt(rawAmount)) {
                    balanceReady = true
                    console.log(`[ERC20-WITHDRAW] Hot wallet balance confirmed after ${i + 1} polls`)
                    break
                }
                console.log(`[ERC20-WITHDRAW] Waiting for forward to reflect... poll ${i + 1}/${MAX_BALANCE_POLLS}`)
                await new Promise(r => setTimeout(r, BALANCE_POLL_INTERVAL))
            }
            if (!balanceReady) {
                throw new Error('Forward completed but hot wallet balance not yet visible. Will retry via backoff.')
            }
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
        } catch (simErr) {
            console.error(`[ERC20-WITHDRAW] EVM Simulation Failed for ${withdrawAddress}:`, simErr.message)
            throw new Error(`Transaction simulation reverted: ${simErr.message}`)
        }
        const gasLimit = (BigInt(gasEstimate) * 120n) / 100n
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
    }, { concurrency: 15 })

    // Handler de fallo final: cuando el job agota TODOS sus reintentos,
    // marcar la transacción como fallida y notificar al usuario via WebSocket
    .on('failed', async (job, err) => {
        // Solo ejecutar rollback cuando es el ÚLTIMO intento (sin más reintentos posibles)
        if (!job) return
        const maxAttempts = job.opts?.attempts || 0
        if (maxAttempts > 0 && job.attemptsMade < maxAttempts) return

        try {
            const { transactionId } = job.data
            if (!transactionId) return
            const Transaction = require(`${appRoot}/config/models/Transaction`)
            await Transaction.updateOne(
                { _id: transactionId },
                { $set: { status: 5 } }  // 5 = Broadcast Failed
            )
            const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)
            await publishTransactionStatusUpdate({
                transactionId,
                status: 5,
                confirmations: 0,
                source: 'erc20-withdraw-final-failure'
            })
            console.error(`[ERC20-WITHDRAW] FINAL FAILURE for tx ${transactionId}: ${err.message}. Transaction marked as failed (status:5).`)
        } catch (rollbackErr) {
            console.error(`[ERC20-WITHDRAW] Rollback failed:`, rollbackErr.message)
        }
    })
})
