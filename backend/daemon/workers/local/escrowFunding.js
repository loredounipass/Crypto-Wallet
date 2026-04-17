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

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const coins = require(`${appRoot}/config/coins/info`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
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

    // Try on-chain escrow via smart contract
    const interactor = new EscrowContractInteractor(chainId)
    const contractAvailable = await interactor.isContractAvailable()

    let escrowTxHash = null

    if (contractAvailable) {
        console.log('[ESCROW-FUNDING] Contract available, funding on-chain...')

        const receipt = await interactor.createOrderOnChain(
            orderId,
            sellerWalletAddress,
            providerWalletAddress,
            amountWei
        )

        if (!receipt || !receipt.status) {
            throw new Error(`[ESCROW-FUNDING] On-chain funding failed for order ${orderId}`)
        }

        escrowTxHash = receipt.transactionHash
        console.log('[ESCROW-FUNDING] On-chain funding successful:', { orderId, txHash: escrowTxHash })
    } else {
        // Fallback: off-chain escrow — funds stay in relayer wallet
        // The balance was already deducted from seller's DB wallet in escrow.service.ts
        console.log('[ESCROW-FUNDING] Contract not available, using off-chain escrow (relayer wallet)')
        escrowTxHash = `offchain-${orderId}`
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
