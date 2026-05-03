/**
 * Escrow Cancel Worker
 * 
 * BullMQ worker that processes the 'escrow-cancel' queue.
 * When a seller cancels an order, this worker:
 *   1. Calls EscrowContract.refundFunds() to transfer on-chain
 *   2. If contract not available, refunds directly from escrow wallet
 *   3. Registers the refund transaction for 12 confirmations
 *   4. Updates EscrowOrder status to 'cancelled'
 *   5. Emits status update event via escrow-status-events queue
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
const USE_ESCROW_CONTRACT = process.env.ESCROW_USE_CONTRACT === 'true'

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}

const registerEscrowRefundTransaction = async (order, refundTxHash) => {
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
        console.warn('[ESCROW-CANCEL-WORKER] Seller wallet not found for refund registration:', {
            orderId: order.orderId,
            sellerAddress,
            coin,
            chainId
        })
        return null
    }

    const isInternal = !refundTxHash
    const transaction = new Transaction({
        nature: 1, // Deposit (Refund)
        amount: Number(order.amount || 0),
        created_at: Date.now(),
        status: isInternal ? 3 : 1,
        confirmations: 0,
        txHash: txHashToUse,
        to: order.sellerWalletAddress
    })
    await transaction.save()

    await Wallet.updateOne(
        { _id: ObjectId(wallet._id) },
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
            removeOnComplete: true,
            removeOnFail: 50
        })
        console.log('[ESCROW-CANCEL-WORKER] Registered refund tx for confirmation tracking:', {
            orderId: order.orderId,
            txHash: txHashToUse,
            transactionId: transaction._id.toString()
        })
    } else {
        await Wallet.updateOne(
            { _id: ObjectId(wallet._id) },
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

    let refundTxHash = null

    if (order.escrowTxHash) {
        // Wait for funding transaction to reach 12 confirmations (status === 3)
        const fundingTx = await Transaction.findOne({ txHash: order.escrowTxHash })
        if (fundingTx && fundingTx.status !== 3) {
            console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Blocked: Funding transaction ${order.escrowTxHash} is still pending confirmations (Status: ${fundingTx.status}). Retrying later to avoid blockchain race conditions...`)
            throw new Error('WAITING_FOR_FUNDING_CONFIRMATIONS')
        }
        console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Funding transaction confirmed. Proceeding with on-chain refund...`)

        const decimals = coins[String(order.coin || '').toUpperCase()]?.decimals || 18
        const amountWei = toWeiAmount(order.amount, decimals)
        const interactor = new EscrowContractInteractor(order.chainId)
        const contractAvailable = await interactor.isContractAvailable()
        let refunded = false

        if (USE_ESCROW_CONTRACT && contractAvailable) {
            try {
                console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Strategy 1: Attempting to refund via smart contract...`)
                const receipt = await interactor.refundFundsOnChain(order.orderId)
                if (receipt && receipt.status) {
                    refunded = true
                    refundTxHash = receipt.transactionHash
                    console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Strategy 1 (Contract) Refund Successful! TxHash: ${refundTxHash}`)
                }
            } catch (contractError) {
                console.warn('[ESCROW-CANCEL-WORKER] Contract refund failed, trying escrow wallet fallback:', contractError.message)
            }
        }

        if (!refunded) {
            console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Strategy 2: Attempting to refund directly from Escrow Wallet...`)
            const receipt = await interactor.refundFundsFromEscrowWallet(order.orderId, order.sellerWalletAddress, amountWei)
            if (receipt && receipt.status) {
                refunded = true
                refundTxHash = receipt.transactionHash
                console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] Strategy 2 (Escrow Wallet) Refund Successful! TxHash: ${refundTxHash}`)
            }
        }

        if (!refunded) {
            throw new Error('Refund transaction failed in all strategies')
        }
    } else {
        console.log(`[ESCROW-CANCEL-WORKER] [Job ${orderId}] No on-chain transaction found (escrowTxHash is null). Proceeding with internal DB refund...`)
    }

    await registerEscrowRefundTransaction(order, refundTxHash)

    await EscrowOrder.updateOne(
        { orderId },
        { $set: { status: 'cancelled' } }
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
