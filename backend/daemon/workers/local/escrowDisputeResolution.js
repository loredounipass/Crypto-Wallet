/**
 * Escrow Dispute Resolution Worker
 *
 * Polling daemon that checks for disputed escrow orders where the admin
 * has manually set isReverted=true (seller won) or isAwarded=true (provider won).
 *
 * When such an order is found:
 *   1. Transfers funds from escrow wallet to the winner
 *   2. Registers the transaction in the confirmation pipeline (12 confirmations)
 *   3. Updates EscrowOrder status to 'resolved'
 *   4. Emits status update event via escrow-status-events queue
 *
 * This worker runs as a daemon, not a BullMQ queue consumer.
 */

const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const { parseUnits } = require('ethers')
const ObjectId = require('mongoose').Types.ObjectId

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Provider = require(`${appRoot}/config/models/Provider`)
const coins = require(`${appRoot}/config/coins/info`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)

const POLL_INTERVAL_MS = 30000

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}

const registerResolutionTransaction = async (order, txHash, resolutionType) => {
    const coin = String(order.coin || '').toUpperCase()
    const chainId = Number(order.chainId)

    let txHashToUse = txHash || `internal-resolve-${resolutionType}-${order.orderId}`
    const recipientAddress = resolutionType === 'award'
        ? String(order.providerWalletAddress || '').toLowerCase()
        : String(order.sellerWalletAddress || '').toLowerCase()

    const existing = await Transaction.findOne({ txHash: txHashToUse })
    if (existing) {
        console.log('[DISP-RESOLVE] Existing transaction found, skipping registration:', {
            orderId: order.orderId,
            txHash: txHashToUse,
            transactionId: existing._id.toString()
        })
        return existing
    }

    const wallet = await Wallet.findOne({
        address: new RegExp(`^${recipientAddress}$`, 'i'),
        coin,
        chainId
    })

    if (!wallet) {
        console.error('[DISP-RESOLVE] Recipient wallet not found for transaction registration, will retry:', {
            orderId: order.orderId,
            recipientAddress,
            coin,
            chainId
        })
        throw new Error(`Recipient wallet not found for order ${order.orderId}`)
    }

    const isInternal = !txHash
    const transaction = new Transaction({
        nature: 1,
        amount: Number(order.amount || 0),
        created_at: Date.now(),
        status: isInternal ? 3 : 1,
        confirmations: 0,
        txHash: txHashToUse,
        to: recipientAddress
    })
    await transaction.save()

    await Wallet.updateOne(
        { _id: new ObjectId(wallet._id) },
        { $addToSet: { transactions: transaction._id } }
    )

    if (!isInternal) {
        const depositsQueue = new Queue(`${coin.toLowerCase()}-deposits`)
        await depositsQueue.add('deposit', {
            walletAddress: recipientAddress,
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
        console.log('[DISP-RESOLVE] Registered resolution tx for confirmation tracking:', {
            orderId: order.orderId,
            txHash: txHashToUse,
            transactionId: transaction._id.toString(),
            type: resolutionType
        })
    } else {
        await Wallet.updateOne(
            { _id: new ObjectId(wallet._id) },
            { $inc: { balance: order.amount } }
        )
        console.log('[DISP-RESOLVE] DB internal resolution complete:', {
            orderId: order.orderId,
            amount: order.amount,
            coin: order.coin,
            type: resolutionType
        })
    }

    return transaction
}

/**
 * Check if a transaction matching the given criteria could be a legitimate previous
 * resolution attempt (partial success guard). Uses strict matching to avoid false positives.
 */
const findPreviousResolutionTx = async (orderId, recipientAddress, amount) => {
    const patternMatch = await Transaction.findOne({
        $or: [
            { txHash: `internal-resolve-revert-${orderId}` },
            { txHash: `internal-resolve-award-${orderId}` },
            { txHash: { $regex: `^onchain-revert-${orderId}$` } },
            { txHash: { $regex: `^onchain-award-${orderId}$` } },
        ]
    })
    if (patternMatch) return patternMatch

    return null
}

const processDisputeResolution = async (order) => {
    const decimals = coins[String(order.coin || '').toUpperCase()]?.decimals || 18
    const amountWei = toWeiAmount(order.amount, decimals)
    const interactor = new EscrowContractInteractor(order.chainId)
    const resolvedType = order.isReverted ? 'revert' : 'award'

    let txHash = null

    // -----Guard: detect retry after partial success (transfer done, DB update failed)-----
    const patternTx = await findPreviousResolutionTx(order.orderId, null, null)
    if (patternTx) {
        console.log('[DISP-RESOLVE] Resolution already processed (found via pattern txHash). Skipping on-chain transfer.', { orderId: order.orderId, txHash: patternTx.txHash })
        txHash = patternTx.txHash
    } else if (order.escrowTxHash && !order.escrowTxHash.startsWith('offchain-')) {
        // Secondary guard: check for matching Transaction with nature=1 (deposit) within the last 30 min.
        // This catches cases where the on-chain tx succeeded but had a non-deterministic txHash
        // that doesn't match our known patterns. Using nature=1 and short window (30min) to avoid false positives.
        const recipientForSearch = order.isReverted ? order.sellerWalletAddress : order.providerWalletAddress
        const amountTx = await Transaction.findOne({
            to: { $regex: `^${recipientForSearch}$`, $options: 'i' },
            amount: Number(order.amount),
            nature: 1,
            created_at: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
        })
        if (amountTx) {
            console.error('[DISP-RESOLVE] BLOCKING: Found matching Transaction (nature=1) without known pattern. Possible retry after real-blockchain transfer. Manual review required.', {
                orderId: order.orderId,
                foundTxHash: amountTx.txHash
            })
            throw new Error(`MANUAL_REVIEW_REQUIRED: Order ${order.orderId} has a matching Transaction but txHash is non-deterministic. Verify funds and update order manually.`)
        }
    }

    if (txHash === null && order.escrowTxHash && !order.escrowTxHash.startsWith('offchain-')) {
        // Wait for funding transaction to reach 12 confirmations before resolving dispute
        const fundingTx = await Transaction.findOne({ txHash: order.escrowTxHash })
        if (!fundingTx || fundingTx.status !== 3) {
            console.log(`[DISP-RESOLVE] Funding transaction ${order.escrowTxHash} is still pending confirmations (Status: ${fundingTx?.status || 'not found'}). Retrying later...`)
            throw new Error('WAITING_FOR_FUNDING_CONFIRMATIONS')
        }
        console.log(`[DISP-RESOLVE] Funding transaction confirmed. Proceeding with dispute resolution...`)

        let receipt = null

        try {
            await interactor.ensureEscrowWalletBalanceForTransfer(
                order.orderId,
                resolvedType === 'revert' ? order.sellerWalletAddress : order.providerWalletAddress,
                amountWei
            )
            if (resolvedType === 'revert') {
                receipt = await interactor.refundFundsFromEscrowWallet(order.orderId, order.sellerWalletAddress, amountWei)
            } else {
                receipt = await interactor.awardFundsFromEscrowWallet(order.orderId, order.providerWalletAddress, amountWei)
            }
        } catch (walletError) {
            console.error('[DISP-RESOLVE] Escrow wallet transfer failed:', walletError.message)
        }

        if (receipt && receipt.status) {
            txHash = receipt.transactionHash
            console.log('[DISP-RESOLVE] Transfer successful:', {
                orderId: order.orderId,
                txHash,
                type: resolvedType
            })
        } else {
            console.error('[DISP-RESOLVE] Escrow wallet transfer failed for:', order.orderId)
            throw new Error(`Escrow wallet transfer failed for order ${order.orderId}`)
        }
    }

    // Register transaction in confirmation pipeline (or internal if no txHash)
    await registerResolutionTransaction(order, txHash, resolvedType)

    // Update escrow order to resolved
    await EscrowOrder.updateOne(
        { orderId: order.orderId },
        {
            $set: {
                status: 'resolved',
                resolvedAt: new Date(),
                resolutionType: resolvedType,
                releaseTxHash: txHash
            }
        }
    )

    // Update provider stats if award
    if (resolvedType === 'award') {
        const providerResult = await Provider.updateOne(
            { email: order.providerEmail },
            {
                $inc: {
                    completedOrders: 1,
                    totalTradeVolume: order.fiatAmount || 0
                }
            }
        )
        if (providerResult.matchedCount === 0) {
            console.warn('[DISP-RESOLVE] Provider not found for stats update:', { orderId: order.orderId, providerEmail: order.providerEmail })
        }
    }

    // Emit status update event
    const statusQueue = new Queue('escrow-status-events')
    statusQueue.add('status-update', {
        orderId: order.orderId,
        status: 'resolved',
        resolutionType: resolvedType,
        sellerEmail: order.sellerEmail,
        providerEmail: order.providerEmail
    }, { removeOnComplete: true, removeOnFail: 50 })

    console.log(`[DISP-RESOLVE] Complete:`, {
        orderId: order.orderId,
        type: resolvedType,
        txHash,
        seller: order.sellerEmail,
        provider: order.providerEmail
    })

    return 'success'
}

const checkDisputedOrders = async () => {
    try {
        const pendingOrders = await EscrowOrder.find({
            status: 'disputed',
            $or: [
                { isReverted: true },
                { isAwarded: true }
            ],
            resolvedAt: null
        }).exec()

        if (pendingOrders.length === 0) return

        console.log(`[DISP-RESOLVE] Found ${pendingOrders.length} disputed orders awaiting resolution`)

        for (const order of pendingOrders) {
            try {
                // Atomic lock: only process if resolvedAt is still null
                const locked = await EscrowOrder.findOneAndUpdate(
                    {
                        orderId: order.orderId,
                        resolvedAt: null,
                        status: 'disputed'
                    },
                    { $set: { resolvedAt: new Date() } }
                )

                if (!locked) {
                    console.log(`[DISP-RESOLVE] Order ${order.orderId} already being processed, skipping`)
                    continue
                }

                await processDisputeResolution(order)
            } catch (orderError) {
                console.error('[DISP-RESOLVE] Error processing order:', order.orderId, orderError.message)
                if (orderError.message.startsWith('MANUAL_REVIEW_REQUIRED')) {
                    // Preserve lock — potential double-spend risk. Admin must verify.
                    console.error('[DISP-RESOLVE] Lock preserved for manual review. Admin must clear resolvedAt after verification.')
                } else {
                    // Safe retry — transfer didn't happen or can be rechecked on-chain
                    await EscrowOrder.updateOne(
                        { orderId: order.orderId },
                        { $set: { resolvedAt: null } }
                    ).catch(e => console.error('[DISP-RESOLVE] Failed to clear lock:', e.message))
                }
            }
        }
    } catch (error) {
        console.error('[DISP-RESOLVE] Error checking disputed orders:', error.message || error)
    }
}

connectDB.then(() => {
    console.log('[DISP-RESOLVE] Worker started, polling every', POLL_INTERVAL_MS, 'ms')

    checkDisputedOrders()

    setInterval(checkDisputedOrders, POLL_INTERVAL_MS)
})
