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


// CONVERTS HUMAN-READABLE COIN AMOUNTS TO BASE WEI UNITS USING SPECIFIED DECIMALS
const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}


// REGISTERS NATIVE ESCROW FUNDING TRANSACTION DOCUMENT AND ENQUEUES WITHDRAW CONFIRMATION TRACKING
const registerEscrowFundingTransaction = async (order, escrowTxHash, escrowTargetAddress) => {
    // STEP 1: VALIDATE ESCROW HASH AND LOCATE SELLER WALLET
    if (!escrowTxHash || escrowTxHash.startsWith('offchain-')) return null
    const coin = String(order.coin || '').toUpperCase()
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)
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

    // STEP 2: UPSERT WITHDRAWAL TRANSACTION RECORD AND LINK TO SELLER WALLET
    const transaction = await Transaction.findOneAndUpdate(
        { txHash: escrowTxHash },
        {
            $setOnInsert: {
                nature: 2,
                amount: -1 * Number(order.amount || 0),
                created_at: Date.now(),
                status: 1,
                confirmations: 0,
                txHash: escrowTxHash,
                to: escrowTargetAddress
            }
        },
        { upsert: true, returnDocument: 'after' }
    )
    await Wallet.updateOne(
        { _id: new ObjectId(wallet._id) },
        { $addToSet: { transactions: transaction._id } }
    )

    // STEP 3: ENQUEUE CONFIRMATION TRACKING JOB TO BULLMQ WITH EXPONENTIAL BACKOFF
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


// ORCHESTRATES ESCROW ORDER FUNDING VIA OFF-CHAIN ERC20 LEDGER OR ON-CHAIN ESCROW WALLET TRANSFER
const processEscrowFunding = async (jobData) => {
    const {
        orderId, sellerWalletAddress, providerWalletAddress,
        amount, coin, chainId, gasFee, sellerEmail, providerEmail,
        tokenAddress, isToken
    } = jobData
    console.log('[ESCROW-FUNDING] Processing:', {
        orderId, amount, coin, chainId, isToken: !!isToken,
        seller: sellerWalletAddress?.slice(0, 10) + '...',
        provider: providerWalletAddress?.slice(0, 10) + '...'
    })

    // STEP 1 (ERC20 ROUTE): UTILIZE OFF-CHAIN LEDGER RESERVATION WITHOUT ON-CHAIN ESCROW WALLET DEPOSIT
    if (isToken && tokenAddress) {
        const offchainTxHash = `offchain-ledger-${orderId}`
        await EscrowOrder.updateOne({ orderId }, {
            $set: {
                escrowTxHash: offchainTxHash,
                fundingMethod: 'offchain-ledger',
                status: 'funded'
            }
        })

        const { getTokenInfo } = require(`${appRoot}/config/tokens`)
        const tokenInfo = getTokenInfo(chainId, tokenAddress)
        const tokenSymbol = tokenInfo?.symbol || coin || 'TOKEN'

        // STEP 1.1: PERSIST OFF-CHAIN DEBIT TRANSACTION AND LINK TO SELLER WALLET FOR DASHBOARD AUDITABILITY
        const sellerWallet = await Wallet.findOne({
            address: new RegExp(`^${String(sellerWalletAddress).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            chainId
        })
        if (sellerWallet) {
            const txDoc = await Transaction.findOneAndUpdate(
                { txHash: offchainTxHash, nature: 2 },
                {
                    $setOnInsert: {
                        nature: 2,
                        amount: -1 * Number(amount),
                        created_at: Date.now(),
                        status: 3,
                        confirmations: 0,
                        txHash: offchainTxHash,
                        to: providerWalletAddress,
                        tokenSymbol
                    }
                },
                { upsert: true, returnDocument: 'after' }
            )
            await Wallet.updateOne(
                { _id: new ObjectId(sellerWallet._id) },
                { $addToSet: { transactions: txDoc._id } }
            )

            // STEP 1.2: BROADCAST REAL-TIME TRANSACTION UPDATE AND EMIT ORDER STATUS EVENT TO WEBSOCKET CONSUMERS
            const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)
            await publishTransactionStatusUpdate({
                transactionId: txDoc._id.toString(),
                status: 3,
                confirmations: 0,
                nature: 2,
                amount: -1 * Number(amount),
                coin: tokenSymbol,
                tokenSymbol,
                chainId,
                txHash: offchainTxHash,
                to: providerWalletAddress,
                fee: 0,
                source: 'escrow-funding-erc20-offchain'
            })

            console.log('[ESCROW-FUNDING] ERC20 Transaction registered for seller UI:', {
                orderId,
                txId: txDoc._id.toString(),
                tokenSymbol,
                walletId: sellerWallet._id.toString()
            })
        } else {
            console.warn('[ESCROW-FUNDING] Seller wallet not found for ERC20 Transaction registration:', {
                orderId, sellerWalletAddress, chainId
            })
        }

        const statusQueue = new Queue('escrow-status-events')
        statusQueue.add('status-update', {
            orderId, status: 'funded', sellerEmail, providerEmail, escrowTxHash: offchainTxHash
        }, { removeOnComplete: true, removeOnFail: 50 })
        console.log('[ESCROW-FUNDING] ERC20 token order funded via offchain-ledger:', { orderId, tokenAddress })
        return 'success'
    }

    // STEP 2 (NATIVE ROUTE): VERIFY ORDER STATUS AND PREPARE ON-CHAIN ESCROW CONTRACT PARAMETERS
    const order = await EscrowOrder.findOne({ orderId })
    if (!order) {
        throw new Error(`[ESCROW-FUNDING] Order not found: ${orderId}`)
    }
    if (order.status !== 'pending') {
        console.log(`[ESCROW-FUNDING] Order ${orderId} status is '${order.status}', expected 'pending', skipping funding`)
        return 'skipped'
    }
    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const amountWei = toWeiAmount(amount, decimals)
    const interactor = new EscrowContractInteractor(chainId)
    let escrowTxHash = order.escrowTxHash

    // STEP 3 (NATIVE ROUTE): RECONCILE PRIOR UNCONFIRMED ATTEMPTS - AUDIT CHAIN RECEIPTS, STALE BROADCASTS, AND MEMPOOL NONCES
    if (escrowTxHash && !order.fundingMethod) {
        console.log(`[ESCROW-FUNDING] Found pending escrowTxHash ${escrowTxHash}. Checking status...`)
        let chainReceipt = null
        let receiptMissing = false
        try {
            chainReceipt = await interactor.web3.eth.getTransactionReceipt(escrowTxHash)
        } catch (e) {
            if (e.message && (e.message.includes('Transaction not found') || e.message.includes('not found'))) {
                receiptMissing = true
            } else {
                throw new Error('WAITING_FOR_FUNDING_CONFIRMATION')
            }
        }
        if (receiptMissing || chainReceipt === null) {
            let txExists = false
            let txNonce = null
            try {
                const tx = await interactor.web3.eth.getTransaction(escrowTxHash)
                txExists = !!tx
                if (txExists) txNonce = Number(tx.nonce)
            } catch (e) {
                txExists = false
            }
            // STEP 3.1: HANDLE UNMINED TRANSACTIONS - PURGE STALE HASHES OR RESET RELAYER NONCES IF GAP IS DETECTED
            if (!txExists) {
                console.log(`[ESCROW-FUNDING] Stale pre-saved hash ${escrowTxHash} never broadcast. Clearing and retrying fresh...`)
                await EscrowOrder.updateOne({ orderId }, { $unset: { escrowTxHash: '' } })
                escrowTxHash = null
            } else if (txNonce !== null) {
                const hotAddr = interactor.hotWalletAddress
                const chainNonce = Number(await interactor.web3.eth.getTransactionCount(hotAddr, 'pending'))
                if (txNonce > chainNonce + 5) {
                    console.log(`[ESCROW-FUNDING] Orphaned tx ${escrowTxHash} nonce=${txNonce} chainNonce=${chainNonce}. Clearing hash + resetting TxManager...`)
                    await EscrowOrder.updateOne({ orderId }, { $unset: { escrowTxHash: '' } })
                    const TxManager = require(`${appRoot}/config/utils/TxManager`)
                    await TxManager.resetNonce(hotAddr, interactor.chainId)
                    escrowTxHash = null
                } else {
                    console.log(`[ESCROW-FUNDING] Tx ${escrowTxHash} still pending on chain, waiting...`)
                    throw new Error('WAITING_FOR_FUNDING_CONFIRMATION')
                }
            } else {
                console.log(`[ESCROW-FUNDING] Tx ${escrowTxHash} still pending on chain, waiting...`)
                throw new Error('WAITING_FOR_FUNDING_CONFIRMATION')
            }
        } else if (chainReceipt) {
            if (!chainReceipt.status) {
                console.log(`[ESCROW-FUNDING] Previous tx ${escrowTxHash} failed on chain. Clearing and retrying fresh...`)
                await EscrowOrder.updateOne({ orderId }, { $unset: { escrowTxHash: '' } })
                escrowTxHash = null
            } else {
                console.log(`[ESCROW-FUNDING] Pending tx ${escrowTxHash} confirmed on chain!`)
            }
        }
    }
    if (escrowTxHash && order.fundingMethod) {
        console.log(`[ESCROW-FUNDING] Order ${orderId} already funded (method=${order.fundingMethod}, tx=${escrowTxHash}), skipping`)
        return 'success'
    }

    // STEP 4 (NATIVE ROUTE): EXECUTE ON-CHAIN FUNDING - DISPATCH FUNDS TO ESCROW WALLET AND ATOMICALLY PRE-SAVE TX HASH
    if (!escrowTxHash) {
        console.log('[ESCROW-FUNDING] Funding escrow wallet...')
        const onTxHash = async (hash) => {
            escrowTxHash = hash
            console.log(`[ESCROW-FUNDING] Pre-saving escrowTxHash ${hash} to prevent duplicate retries`)
            await EscrowOrder.updateOne({ orderId }, { $set: { escrowTxHash: hash } })
        }
        const receipt = await interactor.fundEscrowWallet(orderId, amountWei, onTxHash)
        if (!receipt || !receipt.status) {
            throw new Error('[ESCROW-FUNDING] Escrow wallet funding failed')
        }
        escrowTxHash = receipt.transactionHash
    }

    // STEP 5 (NATIVE ROUTE): FINALIZE NATIVE FUNDING STATE, ENQUEUE CONFIRMATION TRACKING, AND EMIT LIFECYCLE EVENT
    const fundingMethod = 'wallet'
    await EscrowOrder.updateOne(
        { orderId },
        {
            $set: {
                escrowTxHash,
                fundingMethod,
                status: 'funded'
            }
        }
    )
    await registerEscrowFundingTransaction(order, escrowTxHash, process.env.ESCROW_WALLET_ADDRESS)
    const statusQueue = new Queue('escrow-status-events')
    statusQueue.add('status-update', {
        orderId,
        status: 'funded',
        sellerEmail,
        providerEmail,
        escrowTxHash
    }, { removeOnComplete: true, removeOnFail: 50 })
    console.log('[ESCROW-FUNDING] Complete:', { orderId, escrowTxHash, fundingMethod })
    return 'success'
}


connectDB.then(() => {
    // CONSUMES QUEUED ESCROW FUNDING JOBS CONCURRENTLY AND PROCESSES DEPOSIT ALLOCATION
    new Worker('escrow-funding', async (job) => {
        return await processEscrowFunding(job.data)
    }, { concurrency: 15 })
    console.log('[ESCROW-FUNDING] Worker started and ready')
})
