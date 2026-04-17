/**
 * Escrow Release Worker
 * 
 * BullMQ worker that processes the 'escrow-release' queue.
 * When a seller approves fund release, this worker:
 *   1. Calls EscrowContract.releaseFunds() to transfer on-chain
 *   2. If contract not available, sends directly from relayer wallet
 *   3. Credits provider's wallet balance in DB
 *   4. Updates provider stats (completedOrders, totalTradeVolume)
 *   5. Updates EscrowOrder status to 'completed'
 *   6. Emits status update event via escrow-status-events queue
 * 
 * Queue: 'escrow-release'
 * Job data: { orderId, providerWalletAddress, sellerWalletAddress, amount, coin, chainId, sellerEmail, providerEmail }
 * Config: attempts: 5, backoff: exponential 5s
 */

const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker, Queue } = require(`${appRoot}/config/bullmq`)
const { Web3 } = require('web3')
const { parseUnits } = require('ethers')
const ObjectId = require('mongoose').Types.ObjectId

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const User = require(`${appRoot}/config/models/User`)
const Provider = require(`${appRoot}/config/models/Provider`)
const coins = require(`${appRoot}/config/coins/info`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}

/**
 * Send a direct transfer from the relayer wallet (off-chain fallback)
 */
const sendDirectTransfer = async (chainId, providerWalletAddress, amountWei) => {
    const web3 = new Web3(require(`${appRoot}/config/chains/${chainId}`).rpc)
    const fromAddress = web3.utils.toChecksumAddress(process.env.ESCROW_RELAYER_WALLET)
    const toAddress = web3.utils.toChecksumAddress(providerWalletAddress)

    const gasPrice = BigInt(await web3.eth.getGasPrice())
    const gasLimit = BigInt(await web3.eth.estimateGas({
        from: fromAddress,
        to: toAddress,
        value: amountWei.toString()
    }))

    const senderBalance = BigInt(await web3.eth.getBalance(fromAddress))
    const requiredBalance = BigInt(amountWei) + (gasPrice * gasLimit)

    if (senderBalance < requiredBalance) {
        throw new Error(`Insufficient relayer balance: required=${requiredBalance} available=${senderBalance}`)
    }

    const nonce = await web3.eth.getTransactionCount(fromAddress, 'pending')
    const txChainId = await web3.eth.getChainId()

    const transaction = {
        from: fromAddress,
        chainId: txChainId,
        nonce: web3.utils.toHex(nonce),
        gasPrice: gasPrice.toString(),
        gas: gasLimit.toString(),
        to: toAddress,
        value: amountWei.toString()
    }

    const signedTx = await web3.eth.accounts.signTransaction(
        transaction,
        process.env.ESCROW_RELAYER_PRIVATE_KEY
    )

    return await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
}

/**
 * Credit the provider's wallet balance in the database
 */
const creditProviderWallet = async (providerEmail, coin, amount) => {
    const walletData = await User.aggregate([
        { $match: { email: providerEmail } },
        { $unwind: '$wallets' },
        { $project: { _id: 0 } },
        {
            $lookup: {
                from: 'wallets',
                localField: 'wallets',
                foreignField: '_id',
                as: 'walletsData',
                pipeline: [
                    { $match: { coin: coin.toUpperCase() } }
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
                { $inc: { balance: amount } }
            )
            console.log('[ESCROW-RELEASE] Credited provider wallet:', {
                email: providerEmail, coin, amount, walletId: wallet._id
            })
            return true
        }
    }
    console.warn('[ESCROW-RELEASE] Could not find provider wallet to credit:', { providerEmail, coin })
    return false
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
        throw new Error(`[ESCROW-RELEASE] Invalid order state: ${order?.status || 'not found'}`)
    }

    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const amountWei = toWeiAmount(amount, decimals)

    let releaseTxHash = null

    // ===== STRATEGY 1: Use smart contract if available =====
    const interactor = new EscrowContractInteractor(chainId)
    const contractAvailable = await interactor.isContractAvailable()

    if (contractAvailable && order.escrowTxHash && !order.escrowTxHash.startsWith('offchain-')) {
        console.log('[ESCROW-RELEASE] Releasing via smart contract...')

        try {
            const receipt = await interactor.releaseFundsOnChain(orderId)

            if (!receipt || !receipt.status) {
                throw new Error('Contract release transaction failed')
            }

            releaseTxHash = receipt.transactionHash
            console.log('[ESCROW-RELEASE] Contract release successful:', { orderId, txHash: releaseTxHash })
        } catch (contractError) {
            console.warn('[ESCROW-RELEASE] Contract release failed, falling back to direct transfer:', contractError.message)
            // Fall through to direct transfer
        }
    }

    // ===== STRATEGY 2: Direct transfer from relayer wallet (fallback) =====
    if (!releaseTxHash) {
        console.log('[ESCROW-RELEASE] Releasing via direct transfer from relayer wallet...')

        const receipt = await sendDirectTransfer(chainId, providerWalletAddress, amountWei)

        if (!receipt || !receipt.status) {
            throw new Error('[ESCROW-RELEASE] Direct transfer failed')
        }

        releaseTxHash = receipt.transactionHash
        console.log('[ESCROW-RELEASE] Direct transfer successful:', { orderId, txHash: releaseTxHash })
    }

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

    // 2. Credit provider's wallet balance in DB
    await creditProviderWallet(providerEmail, coin, amount)

    // 3. Update provider stats
    await Provider.updateOne(
        { email: providerEmail },
        {
            $inc: {
                completedOrders: 1,
                totalTradeVolume: order.fiatAmount || 0
            }
        }
    )

    // 4. Emit status update via queue → WebSocket
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
    new Worker('escrow-release', async (job) => {
        return await processEscrowRelease(job.data)
    })
    console.log('[ESCROW-RELEASE] Worker started and ready')
})
