/**
 * Escrow Expiry Worker
 * 
 * Polling worker that checks for expired escrow orders every 60 seconds.
 * When an order expires (expiresAt < now && status in ['pending', 'funded']):
 *   1. If funds were locked on-chain, calls EscrowContract.refundFunds()
 *   2. Refunds the seller's wallet balance in MongoDB
 *   3. Sets the order status to 'expired'
 *   4. Emits a status update event via the escrow-status-events queue
 * 
 * This worker runs as a daemon, not a BullMQ queue consumer.
 */

const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const ObjectId = require('mongoose').Types.ObjectId
const { parseUnits } = require('ethers')

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const User = require(`${appRoot}/config/models/User`)
const Transaction = require(`${appRoot}/config/models/Transaction`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)
const coins = require(`${appRoot}/config/coins/info`)
const USE_ESCROW_CONTRACT = process.env.ESCROW_USE_CONTRACT === 'true'

const POLL_INTERVAL_MS = 60000 // Check every 60 seconds

const registerEscrowRefundTransaction = async (order, refundTxHash) => {
    const coin = String(order.coin || '').toUpperCase()
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)

    let txHashToUse = refundTxHash || `internal-refund-${order.orderId}`

    const existing = await Transaction.findOne({ txHash: txHashToUse })
    if (existing) {
        console.log('[ESCROW-EXPIRY] Existing transaction found for refund, skipping registration:', {
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
        console.warn('[ESCROW-EXPIRY] Seller wallet not found for refund registration:', {
            orderId: order.orderId,
            sellerAddress,
            coin,
            chainId
        })
        return null
    }

    // Si hay txHash (on-chain), se marca pendiente (status 1). Si es interna, se marca completada (status 3).
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
        // Enviar a la cola de depósitos para confirmación
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
        console.log('[ESCROW-EXPIRY] Registered refund tx for confirmation tracking:', {
            orderId: order.orderId,
            txHash: txHashToUse,
            transactionId: transaction._id.toString()
        })
    } else {
        // Reembolso interno inmediato
        await Wallet.updateOne(
            { _id: ObjectId(wallet._id) },
            { $inc: { balance: order.amount } }
        )
        console.log('[ESCROW-EXPIRY] DB internal refund complete:', {
            orderId: order.orderId,
            amount: order.amount,
            coin: order.coin,
            seller: order.sellerEmail
        })
    }

    return transaction
}

const refundSellerWallet = async (order) => {
    let refundTxHash = null;

    // 1. If order was funded on-chain, refund via smart contract
    if (order.escrowTxHash) {
        try {
            const interactor = new EscrowContractInteractor(order.chainId)
            const contractAvailable = await interactor.isContractAvailable()
            const decimals = coins[String(order.coin || '').toUpperCase()]?.decimals || 18
            const amountWei = parseUnits(String(order.amount), decimals)
            let refunded = false

            if (USE_ESCROW_CONTRACT && contractAvailable) {
                try {
                    console.log('[ESCROW-EXPIRY] Refunding via escrow contract:', { orderId: order.orderId })
                    const receipt = await interactor.refundFundsOnChain(order.orderId)
                    if (receipt && receipt.status) {
                        refunded = true
                        refundTxHash = receipt.transactionHash
                        console.log('[ESCROW-EXPIRY] Contract refund successful:', {
                            orderId: order.orderId,
                            txHash: refundTxHash
                        })
                    }
                } catch (contractError) {
                    console.warn('[ESCROW-EXPIRY] Contract refund failed, trying escrow wallet fallback:', contractError.message)
                }
            }

            if (!refunded) {
                const receipt = await interactor.refundFundsFromEscrowWallet(order.orderId, order.sellerWalletAddress, amountWei)
                if (receipt && receipt.status) {
                    refunded = true
                    refundTxHash = receipt.transactionHash
                    console.log('[ESCROW-EXPIRY] Escrow wallet refund successful:', {
                        orderId: order.orderId,
                        txHash: refundTxHash
                    })
                }
            }

            if (!refunded) {
                throw new Error('Refund transaction failed in all strategies')
            }
        } catch (error) {
            console.warn('[ESCROW-EXPIRY] On-chain refund error:', error.message)
            throw error
        }
    }

    // 2. Refund seller's wallet balance using Transaction queue (or internal if no hash)
    await registerEscrowRefundTransaction(order, refundTxHash)
}

const checkExpiredOrders = async () => {
    try {
        const expiredOrders = await EscrowOrder.find({
            status: { $in: ['pending', 'funded'] },
            expiresAt: { $lt: new Date() }
        }).exec()

        if (expiredOrders.length === 0) return

        console.log(`[ESCROW-EXPIRY] Found ${expiredOrders.length} expired orders`)

        const statusQueue = new Queue('escrow-status-events')

        for (const order of expiredOrders) {
            try {
                // Refund seller (on-chain + DB)
                await refundSellerWallet(order)

                // Update order status
                await EscrowOrder.updateOne(
                    { orderId: order.orderId },
                    { $set: { status: 'expired' } }
                )

                // Emit status event
                statusQueue.add('status-update', {
                    orderId: order.orderId,
                    status: 'expired',
                    sellerEmail: order.sellerEmail,
                    providerEmail: order.providerEmail,
                }, { removeOnComplete: true, removeOnFail: 50 })

                console.log('[ESCROW-EXPIRY] Order expired and refunded:', order.orderId)
            } catch (orderError) {
                console.error('[ESCROW-EXPIRY] Error processing expired order:', order.orderId, orderError.message)
            }
        }
    } catch (error) {
        console.error('[ESCROW-EXPIRY] Error checking expired orders:', error.message || error)
    }
}

connectDB.then(() => {
    console.log('[ESCROW-EXPIRY] Worker started, polling every', POLL_INTERVAL_MS, 'ms')

    // Run immediately on start
    checkExpiredOrders()

    // Then poll on interval
    setInterval(checkExpiredOrders, POLL_INTERVAL_MS)
})
