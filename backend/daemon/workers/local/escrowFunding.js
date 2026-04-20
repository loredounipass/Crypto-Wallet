/**
 * Escrow Funding Worker
 * 
 * BullMQ worker that processes the 'escrow-funding' queue.
 * When a seller creates a P2P order, this worker:
 *   1. Takes the order details from the queue
 *   2. Calls EscrowContract.createOrder() to lock funds on-chain
 *   3. Updates the EscrowOrder in MongoDB with the tx hash
 *   4. Emits a status update event via the escrow-status-events queue
 * 
 * If the contract is not deployed yet, it falls back to the
 * off-chain escrow via the relayer wallet (direct transfer).
 * 
 * Queue: 'escrow-funding'
 * Job data: { orderId, sellerWalletAddress, providerWalletAddress, amount, coin, chainId, sellerEmail, providerEmail }
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

const registerEscrowFundingTransaction = async (order, escrowTxHash) => {
    if (!escrowTxHash || escrowTxHash.startsWith('offchain-')) return null

    const coin = String(order.coin || '').toUpperCase()
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)

    const existing = await Transaction.findOne({ txHash: escrowTxHash })
    if (existing) {
        console.log('[ESCROW-FUNDING] Existing transaction found for tx hash, skipping registration:', {
            orderId: order.orderId,
            txHash: escrowTxHash,
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
        console.warn('[ESCROW-FUNDING] Seller wallet not found for escrow transaction registration:', {
            orderId: order.orderId,
            sellerAddress,
            coin,
            chainId
        })
        return null
    }

    const transaction = new Transaction({
        nature: 2,
        amount: -1 * Number(order.amount || 0),
        created_at: Date.now(),
        status: 1,
        confirmations: 0,
        txHash: escrowTxHash,
        to: process.env.ESCROW_CONTRACT_ADDRESS
    })
    await transaction.save()

    await Wallet.updateOne(
        { _id: ObjectId(wallet._id) },
        { $addToSet: { transactions: transaction._id } }
    )

    // Reuse the normal withdraw confirmation worker (status updates on chain confirmations).
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

const processEscrowFunding = async (jobData) => {
    const {
        orderId, sellerWalletAddress, providerWalletAddress,
        amount, coin, chainId, sellerEmail, providerEmail
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

    if (order.status !== 'funded') {
        console.log(`[ESCROW-FUNDING] Order ${orderId} status is '${order.status}', skipping funding`)
        return 'skipped'
    }

    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const amountWei = toWeiAmount(amount, decimals)

    let escrowTxHash = null

    try {
        const interactor = new EscrowContractInteractor(chainId)
        const isAvailable = await interactor.isContractAvailable()

        if (isAvailable) {
            console.log('[ESCROW-FUNDING] Contract available, creating order on-chain from hot wallet...')
            const receipt = await interactor.createOrderOnChain(
                orderId,
                sellerWalletAddress,
                providerWalletAddress,
                amountWei
            )
            escrowTxHash = receipt.transactionHash
        } else {
            console.log('[ESCROW-FUNDING] Contract not available, skipping on-chain funding.')
            escrowTxHash = `offchain-${orderId}`
        }
    } catch (error) {
        console.error('[ESCROW-FUNDING] On-chain funding failed:', error.message)
        throw error
    }

    // Update order with escrow tx hash
    await EscrowOrder.updateOne(
        { orderId },
        {
            $set: {
                escrowTxHash,
                status: 'funded'
            }
        }
    )

    await registerEscrowFundingTransaction(order, escrowTxHash)

    // Emit status event
    const statusQueue = new Queue('escrow-status-events')
    statusQueue.add('status-update', {
        orderId,
        status: 'funded',
        sellerEmail,
        providerEmail,
        escrowTxHash
    }, { removeOnComplete: true, removeOnFail: 50 })

    console.log('[ESCROW-FUNDING] Complete:', { orderId, escrowTxHash })
    return 'success'
}

connectDB.then(() => {
    new Worker('escrow-funding', async (job) => {
        return await processEscrowFunding(job.data)
    })
    console.log('[ESCROW-FUNDING] Worker started and ready')
})
