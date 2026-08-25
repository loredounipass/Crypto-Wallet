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

const POLL_INTERVAL_MS = 60000



// REGISTRA EL REEMBOLSO COMO UNA NUEVA TRANSACCION ASOCIADA A LA BILLETERA DEL VENDEDOR
const registerEscrowRefundTransaction = async (order, refundTxHash, refundAmountEth = null) => {
    const coin = String(order.coin || '').toUpperCase()
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)
    const txHashToUse = refundTxHash ? String(refundTxHash).toLowerCase() : `internal-refund-${order.orderId}`
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
    let transaction = new Transaction({
        nature: 1,
        amount: actualAmount,
        created_at: Date.now(),
        status: isInternal ? 3 : 1,
        confirmations: 0,
        txHash: txHashToUse,
        to: order.sellerWalletAddress
    })
    let savedTransaction = transaction;
    try {
        await transaction.save()
    } catch (err) {
        if (err.code === 11000) {
            console.log('[ESCROW-EXPIRY] Duplicate txHash on refund, using existing tracking doc for order:', order.orderId)
            const existing = await Transaction.findOne({ txHash: txHashToUse })
            if (existing) {
                savedTransaction = existing
            }
        } else {
            throw err
        }
    }
    await Wallet.updateOne(
        { _id: new ObjectId(wallet._id) },
        { $addToSet: { transactions: savedTransaction._id } }
    )
    if (isInternal) {
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
    } else {
        console.log('[ESCROW-EXPIRY] Registered refund tx for confirmation tracking (WSS will handle deposit enqueue):', {
            orderId: order.orderId,
            txHash: txHashToUse,
            transactionId: savedTransaction._id.toString()
        })
    }
    return savedTransaction
}



// REEMBOLSA LOS FONDOS DIRECTAMENTE DESDE LA BILLETERA ESCROW HACIA LA BILLETERA DEL VENDEDOR
const refundSellerWallet = async (order) => {
    let refundTxHash = null;
    let refundAmountEth = null;
    if (order.escrowTxHash) {
        try {
            const interactor = new EscrowContractInteractor(order.chainId)
            const decimals = coins[String(order.coin || '').toUpperCase()]?.decimals || 18
            const amountWei = parseUnits(String(order.amount), decimals)
            const escrowBalance = await interactor.getNativeBalance(interactor.escrowWalletAddress)
            if (escrowBalance >= amountWei) {
                await interactor.ensureEscrowWalletBalanceForTransfer(order.orderId, order.sellerWalletAddress, amountWei)
                refundAmountEth = order.amount
                console.log('[ESCROW-EXPIRY] Refunding from Escrow Wallet (full amount, gas prepaid):', {
                    orderId: order.orderId,
                    refundAmount: refundAmountEth,
                })
                const receipt = await interactor.refundFundsFromEscrowWallet(order.orderId, order.sellerWalletAddress, amountWei)
                if (receipt && receipt.status) {
                    refundTxHash = receipt.transactionHash
                    console.log('[ESCROW-EXPIRY] Escrow wallet refund successful:', {
                        orderId: order.orderId,
                        txHash: refundTxHash
                    })
                }
            } else {
                console.log('[ESCROW-EXPIRY] Escrow wallet balance is less than amount. Refund already processed on-chain, skipping:', {
                    orderId: order.orderId,
                    balance: escrowBalance.toString(),
                    amount: amountWei.toString()
                })
            }
            if (!refundTxHash && escrowBalance >= amountWei) {
                throw new Error('[ESCROW-EXPIRY] Escrow wallet refund failed')
            }
        } catch (error) {
            console.warn('[ESCROW-EXPIRY] On-chain refund error:', error.message)
            throw error
        }
    }
    await registerEscrowRefundTransaction(order, refundTxHash, refundAmountEth)
}



// CONSULTA PERIÓDICAMENTE LAS ORDENES EXPIRADAS PARA PROCESAR EL REEMBOLSO Y CAMBIAR SU ESTADO
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
                await refundSellerWallet(order)
                await EscrowOrder.updateOne(
                    { orderId: order.orderId },
                    { $set: { status: 'expired' } }
                )
                statusQueue.add('status-update', {
                    orderId: order.orderId,
                    status: 'expired',
                    sellerEmail: order.sellerEmail,
                    providerEmail: order.providerEmail,
                }, { removeOnComplete: true, removeOnFail: 50 })
                console.log('[ESCROW-EXPIRY] Order expired and refunded:', order.orderId)
            } catch (orderError) {
                console.error('[ESCROW-EXPIRY] Error processing expired order:', order.orderId, orderError.message)
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
    checkExpiredOrders()
    setInterval(checkExpiredOrders, POLL_INTERVAL_MS)
})
