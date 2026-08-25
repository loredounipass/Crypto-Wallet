const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker, Queue } = require(`${appRoot}/config/bullmq`)
const { parseUnits } = require('ethers')
const ObjectId = require('mongoose').Types.ObjectId

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const Transaction = require(`${appRoot}/config/models/Transaction`)
const coins = require(`${appRoot}/config/coins/info`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)



// CONVIERTE UNA CANTIDAD LEGIBLE A SU EQUIVALENTE EN WEI CONSIDERANDO LOS DECIMALES
const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}



// REGISTRA LA TRANSACCION DE FONDEO DEL ESCROW ASOCIANDOLA A LA BILLETERA DEL VENDEDOR
const registerEscrowFundingTransaction = async (order, escrowTxHash, escrowTargetAddress) => {
    if (!escrowTxHash || escrowTxHash.startsWith('offchain-')) return null
    const coin = String(order.coin || '').toUpperCase()
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)
    const wallet = await Wallet.findOne({
        address: new RegExp(`^${sellerAddress}$`, 'i'),
        coin,
        chainId
    })
    if (!wallet) {
        console.warn('[ESCROW-FUNDING] Seller wallet not found for escrow transaction registration:', {
            orderId: order.orderId,
            sellerAddress,
            coin,
            chainId
        })
        return null
    }
    const transaction = await Transaction.findOneAndUpdate(
        { txHash: escrowTxHash },
        {
            $setOnInsert: {
                nature: 2,
                amount: -1 * Number(order.amount || 0),
                created_at: Date.now(),
                status: 1,
                confirmations: 0,
                txHash: escrowTxHash,
                to: escrowTargetAddress
            }
        },
        { upsert: true, returnDocument: 'after' }
    )
    await Wallet.updateOne(
        { _id: new ObjectId(wallet._id) },
        { $addToSet: { transactions: transaction._id } }
    )
    const withdrawQueue = new Queue(`${coin.toLowerCase()}-withdraws`)
    await withdrawQueue.add('withdraw', {
        walletAddress: order.sellerWalletAddress,
        transactionHash: escrowTxHash,
        chainId,
        coin,
        transactionId: transaction._id.toString()
    }, {
        attempts: 20,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: 50
    })
    console.log('[ESCROW-FUNDING] Registered funding tx for confirmation tracking:', {
        orderId: order.orderId,
        txHash: escrowTxHash,
        transactionId: transaction._id.toString(),
        walletId: wallet._id.toString()
    })
    return transaction
}



// PROCESA EL FONDEO DE LA ORDEN DE ESCROW TRANSFIRIENDO LOS FONDOS DESDE LA BILLETERA CALIENTE
const processEscrowFunding = async (jobData) => {
    const {
        orderId, sellerWalletAddress, providerWalletAddress,
        amount, coin, chainId, gasFee, sellerEmail, providerEmail
    } = jobData
    console.log('[ESCROW-FUNDING] Processing:', {
        orderId, amount, coin, chainId,
        seller: sellerWalletAddress?.slice(0, 10) + '...',
        provider: providerWalletAddress?.slice(0, 10) + '...'
    })
    const order = await EscrowOrder.findOne({ orderId })
    if (!order) {
        throw new Error(`[ESCROW-FUNDING] Order not found: ${orderId}`)
    }
    if (order.escrowTxHash && order.fundingMethod) {
        console.log(`[ESCROW-FUNDING] Order ${orderId} already funded (method=${order.fundingMethod}, tx=${order.escrowTxHash}), skipping`)
        return 'success'
    }
    if (order.status !== 'pending') {
        console.log(`[ESCROW-FUNDING] Order ${orderId} status is '${order.status}', expected 'pending', skipping funding`)
        return 'skipped'
    }
    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const amountWei = toWeiAmount(amount, decimals)
    let escrowTxHash = null
    try {
        const interactor = new EscrowContractInteractor(chainId)
        console.log('[ESCROW-FUNDING] Funding escrow wallet...')
        const receipt = await interactor.fundEscrowWallet(orderId, amountWei)
        if (!receipt || !receipt.status) {
            throw new Error('[ESCROW-FUNDING] Escrow wallet funding failed')
        }
        escrowTxHash = receipt.transactionHash
    } catch (error) {
        console.error('[ESCROW-FUNDING] On-chain funding failed:', error.message)
        throw error
    }
    const fundingMethod = 'wallet'
    await EscrowOrder.updateOne(
        { orderId },
        {
            $set: {
                escrowTxHash,
                fundingMethod,
                status: 'funded'
            }
        }
    )
    await registerEscrowFundingTransaction(order, escrowTxHash, process.env.ESCROW_WALLET_ADDRESS)
    const statusQueue = new Queue('escrow-status-events')
    statusQueue.add('status-update', {
        orderId,
        status: 'funded',
        sellerEmail,
        providerEmail,
        escrowTxHash
    }, { removeOnComplete: true, removeOnFail: 50 })
    console.log('[ESCROW-FUNDING] Complete:', { orderId, escrowTxHash, fundingMethod })
    return 'success'
}

connectDB.then(() => {
    new Worker('escrow-funding', async (job) => {
        return await processEscrowFunding(job.data)
    })
    console.log('[ESCROW-FUNDING] Worker started and ready')
})
