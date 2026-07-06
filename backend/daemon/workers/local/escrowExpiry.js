/**
 * Escrow Expiry Worker
 * 
 * Polling worker that checks for expired escrow orders every 60 seconds.
 * When an order expires (expiresAt < now && status in ['pending', 'funded']):
 *   1. Refunds funds from escrow wallet to seller
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

const POLL_INTERVAL_MS = 60000 // Check every 60 seconds

const registerEscrowRefundTransaction = async (order, refundTxHash, refundAmountEth = null) => {
    const coin = String(order.coin || '').toUpperCase()
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)

    const txHashToUse = refundTxHash || `internal-refund-${order.orderId}`
    const isInternal = !refundTxHash
    const actualAmount = refundAmountEth !== null ? Number(refundAmountEth) : Number(order.amount || 0)

    const wallet = await Wallet.findOne({
        address: new RegExp(`^${sellerAddress}$`, 'i'),
        coin,
        chainId
    })

    if (!wallet) {
        console.error('[ESCROW-EXPIRY] Seller wallet not found for refund registration, will retry:', {
            orderId: order.orderId,
            sellerAddress,
            coin,
            chainId
        })
        throw new Error(`Seller wallet not found for order ${order.orderId}`)
    }

    const transaction = await Transaction.findOneAndUpdate(
        { txHash: txHashToUse },
        {
            $setOnInsert: {
                nature: 1,
                amount: actualAmount,
                created_at: Date.now(),
                status: isInternal ? 3 : 1,
                confirmations: 0,
                txHash: txHashToUse,
                to: order.sellerWalletAddress
            }
        },
        { upsert: true, returnDocument: 'after' }
    )

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
            { _id: new ObjectId(wallet._id) },
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
    let refundAmountEth = null;

    if (order.escrowTxHash) {
        try {
            const interactor = new EscrowContractInteractor(order.chainId)
            const decimals = coins[String(order.coin || '').toUpperCase()]?.decimals || 18
            const amountWei = parseUnits(String(order.amount), decimals)

            // Idempotency check: if escrow wallet already empty, refund was already processed
            const escrowBalance = await interactor.getNativeBalance(interactor.escrowWalletAddress)
            if (escrowBalance >= amountWei) {
                // Gas was prepaid at order creation (gasFee). Top up escrow wallet if needed,
                // then refund the FULL amount (no gas deduction).
                await interactor.ensureEscrowWalletBalanceForTransfer(order.orderId, order.sellerWalletAddress, amountWei)

                refundAmountEth = order.amount

                console.log('[ESCROW-EXPIRY] Refunding from Escrow Wallet (full amount, gas prepaid):', {
                    orderId: order.orderId,
                    refundAmount: refundAmountEth,
                })
                const receipt = await interactor.refundFundsFromEscrowWallet(order.orderId, order.sellerWalletAddress, amountWei)
            } else {
                console.log('[ESCROW-EXPIRY] Escrow wallet balance is less than amount. Refund already processed on-chain, skipping:', {
                    orderId: order.orderId,
                    balance: escrowBalance.toString(),
                    amount: amountWei.toString()
                })
            }
            if (receipt && receipt.status) {
                refundTxHash = receipt.transactionHash
                console.log('[ESCROW-EXPIRY] Escrow wallet refund successful:', {
                    orderId: order.orderId,
                    txHash: refundTxHash
                })
            }

            if (!refundTxHash) {
                throw new Error('[ESCROW-EXPIRY] Escrow wallet refund failed')
            }
        } catch (error) {
            console.warn('[ESCROW-EXPIRY] On-chain refund error:', error.message)
            throw error
        }
    }

    await registerEscrowRefundTransaction(order, refundTxHash, refundAmountEth)
}

const checkExpiredOrders = async () => {
    try {
        const pendingOrders = await EscrowOrder.find({
            status: { $in: ['pending', 'funded'] },
            expiresAt: { $lt: new Date() },
            expiryLockedAt: null
        }).exec()

        if (pendingOrders.length === 0) return

        console.log(`[ESCROW-EXPIRY] Found ${pendingOrders.length} expired orders`)

        const statusQueue = new Queue('escrow-status-events')

        for (const order of pendingOrders) {
            // Atomic lock: claim this order exclusively
            const claimed = await EscrowOrder.findOneAndUpdate(
                {
                    orderId: order.orderId,
                    status: { $in: ['pending', 'funded'] },
                    expiresAt: { $lt: new Date() },
                    expiryLockedAt: null
                },
                { $set: { expiryLockedAt: new Date() } }
            )

            if (!claimed) {
                console.log(`[ESCROW-EXPIRY] Order ${order.orderId} already claimed by another process, skipping`)
                continue
            }

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
                // Clear lock for retry on next poll cycle
                await EscrowOrder.updateOne(
                    { orderId: order.orderId },
                    { $set: { expiryLockedAt: null } }
                ).catch(e => console.error('[ESCROW-EXPIRY] Failed to clear lock:', e.message))
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
