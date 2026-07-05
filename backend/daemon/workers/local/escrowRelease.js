/**
 * Escrow Release Worker
 * 
 * BullMQ worker that processes the 'escrow-release' queue.
 * When a seller approves fund release, this worker:
 *   1. Transfers funds from escrow wallet to provider
 *   2. Credits provider's wallet balance in DB
 *   3. Updates provider stats (completedOrders, totalTradeVolume)
 *   4. Updates EscrowOrder status to 'completed'
 *   5. Emits status update event via escrow-status-events queue
 * 
 * Queue: 'escrow-release'
 * Job data: { orderId, providerWalletAddress, sellerWalletAddress, amount, coin, chainId, sellerEmail, providerEmail }
 * Config: attempts: 5, backoff: exponential 5s
 */

const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker, Queue } = require(`${appRoot}/config/bullmq`)
const { parseUnits } = require('ethers')
const ObjectId = require('mongoose').Types.ObjectId

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Provider = require(`${appRoot}/config/models/Provider`)
const coins = require(`${appRoot}/config/coins/info`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}

/**
 * Register release tx in the normal deposit-confirmation pipeline (12 conf flow).
 */
const registerEscrowReleaseTransaction = async (order, releaseTxHash) => {
    const coin = String(order.coin || '').toUpperCase()
    const providerAddress = String(order.providerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)

    const existing = await Transaction.findOne({ txHash: releaseTxHash })
    if (existing) {
        console.log('[ESCROW-RELEASE] Existing transaction found for tx hash, skipping registration:', {
            orderId: order.orderId,
            txHash: releaseTxHash,
            transactionId: existing._id.toString()
        })
        return existing
    }

    const wallet = await Wallet.findOne({
        address: new RegExp(`^${providerAddress}$`, 'i'),
        coin,
        chainId
    })

    if (!wallet) {
        console.warn('[ESCROW-RELEASE] Provider wallet not found for escrow transaction registration:', {
            orderId: order.orderId,
            providerAddress,
            coin,
            chainId
        })
        return null
    }

    let transaction
    try {
        transaction = await new Transaction({
            nature: 1,
            amount: Number(order.amount || 0),
            created_at: Date.now(),
            status: 1,
            confirmations: 0,
            txHash: releaseTxHash,
            to: order.providerWalletAddress
        }).save()
    } catch (err) {
        if (err.code === 11000) {
            transaction = await Transaction.findOne({ txHash: releaseTxHash })
            console.log('[ESCROW-RELEASE] Duplicate txHash, using existing:', { txHash: releaseTxHash, transactionId: transaction._id.toString() })
        } else {
            throw err
        }
    }

    await Wallet.updateOne(
        { _id: new ObjectId(wallet._id) },
        { $addToSet: { transactions: transaction._id } }
    )

    // Reuse the normal deposit worker so confirmations/balance update follow the same path.
    const depositsQueue = new Queue(`${coin.toLowerCase()}-deposits`)
    await depositsQueue.add('deposit', {
        walletAddress: order.providerWalletAddress,
        transactionHash: releaseTxHash,
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

    console.log('[ESCROW-RELEASE] Registered release tx for confirmation tracking:', {
        orderId: order.orderId,
        txHash: releaseTxHash,
        transactionId: transaction._id.toString(),
        walletId: wallet._id.toString()
    })

    return transaction
}

/**
 * Main processing function for escrow release
 */
const processEscrowRelease = async (jobData) => {
    const {
        orderId, providerWalletAddress, sellerWalletAddress,
        amount, coin, chainId, sellerEmail, providerEmail
    } = jobData

    console.log('[ESCROW-RELEASE] Processing release:', {
        orderId, amount, coin, chainId,
        provider: providerWalletAddress?.slice(0, 10) + '...'
    })

    const order = await EscrowOrder.findOne({ orderId })
    if (!order || order.status !== 'released') {
        console.error(`[ESCROW-RELEASE] Invalid order state: ${order?.status || 'not found'}`)
        throw new Error(`[ESCROW-RELEASE] Invalid order state: ${order?.status || 'not found'}`)
    }

    // Idempotency: if release already completed, skip
    if (order.releaseTxHash || order.status === 'completed') {
        console.log(`[ESCROW-RELEASE] Order ${orderId} already released (tx=${order.releaseTxHash}), skipping`)
        return 'success'
    }

    // Wait for funding transaction to reach 12 confirmations (status === 3)
    if (order.escrowTxHash && !order.escrowTxHash.startsWith('offchain-')) {
        const fundingTx = await Transaction.findOne({ txHash: order.escrowTxHash })
        if (!fundingTx || fundingTx.status !== 3) {
            console.log(`[ESCROW-RELEASE] Funding transaction ${order.escrowTxHash} is still pending confirmations (Status: ${fundingTx?.status || 'not found'}). Retrying later...`)
            throw new Error('WAITING_FOR_FUNDING_CONFIRMATIONS')
        }
        console.log(`[ESCROW-RELEASE] Funding transaction confirmed. Proceeding with release...`)
    }

    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const amountWei = toWeiAmount(amount, decimals)

    let releaseTxHash = null

    const interactor = new EscrowContractInteractor(chainId)

    console.log('[ESCROW-RELEASE] Releasing via escrow wallet transfer...')
    await interactor.ensureEscrowWalletBalanceForTransfer(orderId, providerWalletAddress, amountWei)
    const receipt = await interactor.releaseFundsFromEscrowWallet(orderId, providerWalletAddress, amountWei)

    if (!receipt || !receipt.status) {
        console.error('[ESCROW-RELEASE] Escrow wallet transfer failed')
        throw new Error('[ESCROW-RELEASE] Escrow wallet transfer failed')
    }

    releaseTxHash = receipt.transactionHash
    console.log('[ESCROW-RELEASE] Escrow wallet transfer successful:', { orderId, txHash: releaseTxHash })

    // ===== Update database =====

    // 1. Update escrow order to completed
    await EscrowOrder.updateOne(
        { orderId },
        {
            $set: {
                status: 'completed',
                releaseTxHash
            }
        }
    )

    // 2. Register tx in normal confirmation pipeline (wallet gets credited after confirmations)
    await registerEscrowReleaseTransaction(order, releaseTxHash)

    // 3. Update provider stats
    const providerResult = await Provider.updateOne(
        { email: providerEmail },
        {
            $inc: {
                completedOrders: 1,
                totalTradeVolume: order.fiatAmount || 0
            }
        }
    )
    if (providerResult.matchedCount === 0) {
        console.warn('[ESCROW-RELEASE] Provider not found for stats update:', { orderId, providerEmail })
    }

    // 4. Emit status update via queue ��' WebSocket
    const statusQueue = new Queue('escrow-status-events')
    statusQueue.add('status-update', {
        orderId,
        status: 'completed',
        sellerEmail,
        providerEmail,
        releaseTxHash
    }, { removeOnComplete: true, removeOnFail: 50 })

    console.log('[ESCROW-RELEASE] ✅ Complete:', {
        orderId, txHash: releaseTxHash, provider: providerEmail
    })

    return 'success'
}

connectDB.then(() => {
    console.log('[ESCROW-RELEASE] Worker started and ready')
    new Worker('escrow-release', async (job) => {
        console.log(`[ESCROW-RELEASE] Processing job ${job.id}`)
        try {
            const result = await processEscrowRelease(job.data)
            console.log(`[ESCROW-RELEASE] Job ${job.id} completed with result: ${result}`)
            return result
        } catch (error) {
            console.error(`[ESCROW-RELEASE] Job ${job.id} failed:`, error.message || error)
            throw error
        }
    })
})
