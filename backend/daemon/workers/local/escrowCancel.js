/**
 * Escrow Cancel Worker
 * 
 * BullMQ worker that processes the 'escrow-cancel' queue.
 * When a seller cancels an order, this worker:
 *   1. Refunds funds directly from escrow wallet to seller
 *   2. Registers the refund transaction for 12 confirmations
 *   3. Updates EscrowOrder status to 'cancelled'
 *   4. Emits status update event via escrow-status-events queue
 * 
 * Queue: 'escrow-cancel'
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
const coins = require(`${appRoot}/config/coins/info`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}

const registerEscrowRefundTransaction = async (order, refundTxHash, refundAmountEth = null) => {
    const coin = String(order.coin || '').toUpperCase()
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)

    let txHashToUse = refundTxHash || `internal-refund-${order.orderId}`

    const existing = await Transaction.findOne({ txHash: txHashToUse })
    if (existing) {
        console.log('[ESCROW-CANCEL-WORKER] Existing transaction found for refund, skipping registration:', {
            orderId: order.orderId,
            txHash: txHashToUse,
            transactionId: existing._id.toString()
        })
        return existing
    }

    const wallet = await Wallet.findOne({
        address: new RegExp(`^${sellerAddress}$`, 'i'),
        coin,
        chainId
    })

    if (!wallet) {
        console.error('[ESCROW-CANCEL-WORKER] Seller wallet not found for refund registration, will retry:', {
            orderId: order.orderId,
            sellerAddress,
            coin,
            chainId
        })
        throw new Error(`Seller wallet not found for order ${order.orderId}`)
    }

    const isInternal = !refundTxHash
    const actualAmount = refundAmountEth !== null ? Number(refundAmountEth) : Number(order.amount || 0)
    let transaction
    try {
        transaction = await new Transaction({
            nature: 1,
            amount: actualAmount,
            created_at: Date.now(),
            status: isInternal ? 3 : 1,
            confirmations: 0,
            txHash: txHashToUse,
            to: order.sellerWalletAddress
        }).save()
    } catch (err) {
        if (err.code === 11000) {
            console.log('[ESCROW-CANCEL-WORKER] Duplicate txHash, skipping deposit enqueue (subscription will handle):', { txHash: txHashToUse })
            return await Transaction.findOne({ txHash: txHashToUse })
        } else {
            throw err
        }
    }

    await Wallet.updateOne(
        { _id: new ObjectId(wallet._id) },
        { $addToSet: { transactions: transaction._id } }
    )

    if (!isInternal) {
        const depositsQueue = new Queue(`${coin.toLowerCase()}-deposits`)
        await depositsQueue.add('deposit', {
            walletAddress: order.sellerWalletAddress,
            transactionHash: txHashToUse,
            chainId,
            coin,
            transactionId: transaction._id.toString()
        }, {
            attempts: 20,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: { age: 86400, count: 1000 },
            removeOnFail: 50
        })
        console.log('[ESCROW-CANCEL-WORKER] Registered refund tx for confirmation tracking:', {
            orderId: order.orderId,
            txHash: txHashToUse,
            transactionId: transaction._id.toString()
        })
    } else {
        await Wallet.updateOne(
            { _id: new ObjectId(wallet._id) },
            { $inc: { balance: order.amount } }
        )
        console.log('[ESCROW-CANCEL-WORKER] DB internal refund complete:', {
            orderId: order.orderId,
            amount: order.amount,
            coin: order.coin,
            seller: order.sellerEmail
        })
    }

    return transaction
}

const processEscrowCancel = async (jobData) => {
    const { orderId, sellerEmail, providerEmail } = jobData

    console.log(`[ESCROW-CANCEL-WORKER] [Job ${jobData.orderId}] Processing cancel request...`)

    const order = await EscrowOrder.findOne({ orderId })
    if (!order || order.status !== 'cancelled') {
        console.error(`[ESCROW-CANCEL-WORKER] Invalid order state: ${order?.status || 'not found'}`)
        throw new Error(`[ESCROW-CANCEL-WORKER] Invalid order state: ${order?.status || 'not found'}`)
    }

    // Idempotency: check if refund was already processed
    if (order.refundTxHash) {
        console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Refund already processed (refundTxHash=${order.refundTxHash}), skipping`)
        return 'success'
    }

    let refundTxHash = null
    let refundAmountEth = null

    if (order.escrowTxHash) {
        // Wait for funding transaction to reach 12 confirmations (status === 3)
        const fundingTx = await Transaction.findOne({ txHash: order.escrowTxHash })
        if (fundingTx && fundingTx.status !== 3) {
            console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Blocked: Funding transaction ${order.escrowTxHash} is still pending confirmations (Status: ${fundingTx.status}). Retrying later to avoid blockchain race conditions...`)
            throw new Error('WAITING_FOR_FUNDING_CONFIRMATIONS')
        }
        console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Funding transaction confirmed. Proceeding with refund...`)

        const decimals = coins[String(order.coin || '').toUpperCase()]?.decimals || 18
        const amountWei = toWeiAmount(order.amount, decimals)
        const interactor = new EscrowContractInteractor(order.chainId)

        // Idempotency check: if escrow wallet already empty, refund was already processed
        const escrowBalance = await interactor.getNativeBalance(interactor.escrowWalletAddress)
        if (escrowBalance < amountWei) {
            console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Escrow wallet balance (${escrowBalance}) is less than amount (${amountWei}). Refund already processed on-chain, skipping...`)
        } else {
            await interactor.ensureEscrowWalletBalanceForTransfer(order.orderId, order.sellerWalletAddress, amountWei)

            refundAmountEth = order.amount
            console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Refunding full amount ${refundAmountEth} (gas prepaid at creation)...`)

            const receipt = await interactor.refundFundsFromEscrowWallet(order.orderId, order.sellerWalletAddress, amountWei)
            if (receipt && receipt.status) {
                refundTxHash = receipt.transactionHash
                console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Escrow Wallet refund successful! TxHash: ${refundTxHash}`)
            }

            if (!refundTxHash) {
                throw new Error('[ESCROW-CANCEL-WORKER] Escrow wallet refund failed')
            }
        }
    } else {
        console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] No on-chain transaction found (escrowTxHash is null). Proceeding with internal DB refund...`)
    }

    await registerEscrowRefundTransaction(order, refundTxHash, refundAmountEth)

    const cancelRefundTxHash = refundTxHash || `internal-refund-${order.orderId}`
    await EscrowOrder.updateOne(
        { orderId },
        {
            $set: {
                status: 'cancelled',
                refundTxHash: cancelRefundTxHash
            }
        }
    )

    const statusQueue = new Queue('escrow-status-events')
    statusQueue.add('status-update', {
        orderId,
        status: 'cancelled',
        sellerEmail,
        providerEmail
    }, { removeOnComplete: true, removeOnFail: 50 })

    console.log('[ESCROW-CANCEL-WORKER] ✅ Complete:', { orderId, txHash: refundTxHash })
    return 'success'
}

connectDB.then(() => {
    console.log('[ESCROW-CANCEL-WORKER] Worker started and ready')
    new Worker('escrow-cancel', async (job) => {
        console.log(`[ESCROW-CANCEL-WORKER] Processing job ${job.id}`)
        try {
            const result = await processEscrowCancel(job.data)
            console.log(`[ESCROW-CANCEL-WORKER] Job ${job.id} completed with result: ${result}`)
            return result
        } catch (error) {
            console.error(`[ESCROW-CANCEL-WORKER] Job ${job.id} failed:`, error.message || error)
            throw error
        }
    })
})
