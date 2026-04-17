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

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const User = require(`${appRoot}/config/models/User`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)

const POLL_INTERVAL_MS = 60000 // Check every 60 seconds

const refundSellerWallet = async (order) => {
    // 1. If order was funded on-chain, refund via smart contract
    if (order.escrowTxHash && !order.escrowTxHash.startsWith('offchain-')) {
        try {
            const interactor = new EscrowContractInteractor(order.chainId)
            const contractAvailable = await interactor.isContractAvailable()

            if (contractAvailable) {
                console.log('[ESCROW-EXPIRY] Refunding on-chain:', { orderId: order.orderId })
                const receipt = await interactor.refundFundsOnChain(order.orderId)

                if (receipt && receipt.status) {
                    console.log('[ESCROW-EXPIRY] On-chain refund successful:', {
                        orderId: order.orderId,
                        txHash: receipt.transactionHash
                    })
                } else {
                    console.warn('[ESCROW-EXPIRY] On-chain refund failed for:', order.orderId)
                }
            }
        } catch (error) {
            console.warn('[ESCROW-EXPIRY] On-chain refund error:', error.message)
            // Continue with DB refund regardless
        }
    }

    // 2. Refund seller's wallet balance in DB
    const walletData = await User.aggregate([
        { $match: { email: order.sellerEmail } },
        { $unwind: '$wallets' },
        { $project: { _id: 0 } },
        {
            $lookup: {
                from: 'wallets',
                localField: 'wallets',
                foreignField: '_id',
                as: 'walletsData',
                pipeline: [
                    { $match: { coin: order.coin } }
                ]
            }
        }
    ]).exec()

    if (walletData && walletData.length > 0) {
        const walletEntry = walletData.find(w => w.walletsData.length > 0)
        if (walletEntry) {
            const wallet = walletEntry.walletsData[0]
            await Wallet.updateOne(
                { _id: ObjectId(wallet._id) },
                { $inc: { balance: order.amount } }
            )
            console.log('[ESCROW-EXPIRY] DB refund complete:', {
                orderId: order.orderId,
                amount: order.amount,
                coin: order.coin,
                seller: order.sellerEmail
            })
        }
    }
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
