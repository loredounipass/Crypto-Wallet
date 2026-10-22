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
const { getTokenInfo } = require(`${appRoot}/config/tokens`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)


// POLLING INTERVAL FOR PERIODICALLY SCANNING DISPUTED ESCROW ORDERS AWAITING RESOLUTION
const POLL_INTERVAL_MS = 30000


// CONVERTS HUMAN-READABLE COIN AMOUNTS TO BASE WEI UNITS USING SPECIFIED DECIMALS
const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}


// REGISTERS INTERNAL DISPUTE RESOLUTION TRANSACTION DOCUMENT AND ATOMICALLY CREDITS BENEFICIARY WALLET
const registerResolutionTransaction = async (order, txHash, resolutionType) => {
    // STEP 1: RESOLVE DETERMINISTIC RESOLUTION HASH AND CHECK FOR EXISTING TRANSACTION
    const coin = String(order.coin || '').toUpperCase()
    const chainId = Number(order.chainId)
    let txHashToUse = txHash ? String(txHash).toLowerCase() : `internal-resolve-${resolutionType}-${order.orderId}`
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

    // STEP 2: LOCATE RECIPIENT WALLET BY CHAIN AND COIN OR THROW FOR RETRY
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

    // STEP 3: PERSIST RESOLUTION TRANSACTION DOCUMENT (STATUS 3 INTERNAL OR STATUS 1 ON-CHAIN)
    const isInternal = !txHash
    let transaction = new Transaction({
        nature: 1,
        amount: Number(order.amount || 0),
        created_at: Date.now(),
        status: isInternal ? 3 : 1,
        confirmations: 0,
        txHash: txHashToUse,
        to: recipientAddress
    })
    let savedTransaction = transaction;
    try {
        await transaction.save()
    } catch (err) {
        if (err.code === 11000) {
            console.log('[DISP-RESOLVE] Duplicate txHash on resolution, using existing tracking doc for order:', order.orderId)
            const existing = await Transaction.findOne({ txHash: txHashToUse })
            if (existing) {
                savedTransaction = existing
            }
        } else {
            throw err
        }
    }

    // STEP 4: LINK TRANSACTION TO BENEFICIARY WALLET AND CREDIT INTERNAL BALANCE IF NON-CHAIN
    await Wallet.updateOne(
        { _id: new ObjectId(wallet._id) },
        { $addToSet: { transactions: savedTransaction._id } }
    )
    if (isInternal) {
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
    } else {
        console.log('[DISP-RESOLVE] Registered resolution tx for confirmation tracking (WSS will handle deposit enqueue):', {
            orderId: order.orderId,
            txHash: txHashToUse,
            transactionId: savedTransaction._id.toString(),
            type: resolutionType
        })
    }
    return savedTransaction
}


// QUERIES FOR EXISTING RESOLUTION TRANSACTIONS MATCHING DETERMINISTIC PATTERNS TO PREVENT DUPLICATES
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


// EXECUTES ERC20 OR NATIVE DISPUTE RESOLUTION BY REFUNDING SELLER OR AWARDING PROVIDER
const processDisputeResolution = async (order) => {
    // STEP 1: INITIALIZE ORDER PARAMETERS AND DETERMINE DISPUTE RESOLUTION TYPE (REVERT VS AWARD)
    const decimals = coins[String(order.coin || '').toUpperCase()]?.decimals || 18
    const interactor = new EscrowContractInteractor(order.chainId)
    const resolvedType = order.isReverted ? 'revert' : 'award'
    let txHash = null

    // STEP 2 (ERC20 ROUTE): PROCESS DISPUTE SETTLEMENT VIA OFF-CHAIN LEDGER OR ON-CHAIN RELAYER TRANSFER
    if (order.isToken && order.tokenAddress) {
        const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)
        const tokenInfo = getTokenInfo(order.chainId, order.tokenAddress)
        const tokenSymbol = tokenInfo?.symbol || order.coin || 'TOKEN'

        // STEP 2.1 (ERC20 REVERT): ATOMICALLY REVERT FUNDS TO SELLER LEDGER AND CREATE DASHBOARD DEPOSIT TRANSACTION
        if (resolvedType === 'revert') {
            const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
            const revertMarker = `internal-resolve-revert-${order.orderId}`
            const claimed = await EscrowOrder.findOneAndUpdate(
                { orderId: order.orderId, releaseTxHash: { $exists: false } },
                { $set: { releaseTxHash: revertMarker } }
            )
            if (!claimed) {
                console.log('[DISP-RESOLVE] ERC20 revert already processed, skipping ledger credit:', {
                    orderId: order.orderId
                })
            } else {
                await Erc20Ledger.updateOne(
                    {
                        walletAddress: order.sellerWalletAddress.toLowerCase(),
                        tokenAddress: order.tokenAddress.toLowerCase(),
                        chainId: order.chainId
                    },
                    { $inc: { available_balance: order.amount } }
                )
            }
            txHash = revertMarker
            console.log('[DISP-RESOLVE] ERC20 token revert to seller ledger:', {
                orderId: order.orderId, amount: order.amount, tokenAddress: order.tokenAddress
            })

            const sellerWallet = await Wallet.findOne({
                address: new RegExp(`^${String(order.sellerWalletAddress).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                chainId: order.chainId
            })
            if (sellerWallet) {
                const txDoc = await Transaction.findOneAndUpdate(
                    { txHash: revertMarker, nature: 1 },
                    {
                        $setOnInsert: {
                            nature: 1,
                            amount: Number(order.amount),
                            created_at: Date.now(),
                            status: 3,
                            confirmations: 0,
                            txHash: revertMarker,
                            to: order.sellerWalletAddress,
                            tokenSymbol
                        }
                    },
                    { upsert: true, returnDocument: 'after' }
                )
                await Wallet.updateOne(
                    { _id: new ObjectId(sellerWallet._id) },
                    { $addToSet: { transactions: txDoc._id } }
                )
                await publishTransactionStatusUpdate({
                    transactionId: txDoc._id.toString(),
                    status: 3,
                    confirmations: 0,
                    nature: 1,
                    amount: Number(order.amount),
                    coin: tokenSymbol,
                    tokenSymbol,
                    chainId: order.chainId,
                    txHash: revertMarker,
                    to: order.sellerWalletAddress,
                    fee: 0,
                    source: 'dispute-revert-erc20'
                })
                console.log('[DISP-RESOLVE] ERC20 revert Transaction registered for seller UI:', {
                    orderId: order.orderId, txId: txDoc._id.toString(), tokenSymbol
                })
            } else {
                console.warn('[DISP-RESOLVE] Seller wallet not found for ERC20 revert Transaction:', {
                    orderId: order.orderId, sellerWalletAddress: order.sellerWalletAddress
                })
            }
        } else {
            // STEP 2.2 (ERC20 AWARD): TRANSFER ERC20 TO PROVIDER ON-CHAIN (FORWARDING FROM SELLER IF NEEDED) AND CREATE TRANSACTION
            const tokenDecimals = tokenInfo?.decimals ?? 18
            const onTxHash = async (hash) => {
                console.log(`[DISP-RESOLVE] Pre-saving releaseTxHash ${hash} to prevent duplicate retries`)
                await EscrowOrder.updateOne({ orderId: order.orderId }, { $set: { releaseTxHash: hash } })
            }
            let receipt = null
            try {
                receipt = await interactor.sendERC20Transfer(
                    order.tokenAddress, order.providerWalletAddress, order.amount, tokenDecimals, onTxHash
                )
            } catch (e) {
                if (e.message && e.message.includes('Insufficient ERC20 balance in hot wallet')) {
                    console.log('[DISP-RESOLVE] Hot wallet short on ERC20, forwarding from seller contract and retrying...', { orderId: order.orderId })
                    await interactor.forwardSellerERC20ToHotWallet(order.sellerWalletAddress, order.tokenAddress)
                    receipt = await interactor.sendERC20Transfer(
                        order.tokenAddress, order.providerWalletAddress, order.amount, tokenDecimals, onTxHash
                    )
                } else {
                    throw e
                }
            }
            if (!receipt || !receipt.status) {
                throw new Error(`ERC20 award transfer failed for order ${order.orderId}`)
            }
            txHash = receipt.transactionHash
            console.log('[DISP-RESOLVE] ERC20 token award to provider:', {
                orderId: order.orderId, txHash, amount: order.amount
            })

            const providerWallet = await Wallet.findOne({
                address: new RegExp(`^${String(order.providerWalletAddress).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                chainId: order.chainId
            })
            if (providerWallet) {
                const txDoc = await Transaction.findOneAndUpdate(
                    { txHash: txHash, nature: 1 },
                    {
                        $setOnInsert: {
                            nature: 1,
                            amount: Number(order.amount),
                            created_at: Date.now(),
                            status: 3,
                            confirmations: 0,
                            txHash: txHash,
                            to: order.providerWalletAddress,
                            tokenSymbol
                        }
                    },
                    { upsert: true, returnDocument: 'after' }
                )
                await Wallet.updateOne(
                    { _id: new ObjectId(providerWallet._id) },
                    { $addToSet: { transactions: txDoc._id } }
                )
                await publishTransactionStatusUpdate({
                    transactionId: txDoc._id.toString(),
                    status: 3,
                    confirmations: 0,
                    nature: 1,
                    amount: Number(order.amount),
                    coin: tokenSymbol,
                    tokenSymbol,
                    chainId: order.chainId,
                    txHash: txHash,
                    to: order.providerWalletAddress,
                    fee: 0,
                    source: 'dispute-award-erc20'
                })
                console.log('[DISP-RESOLVE] ERC20 award Transaction registered for provider UI:', {
                    orderId: order.orderId, txId: txDoc._id.toString(), tokenSymbol
                })
            } else {
                console.warn('[DISP-RESOLVE] Provider wallet not found for ERC20 award Transaction:', {
                    orderId: order.orderId, providerWalletAddress: order.providerWalletAddress
                })
            }
        }

        // STEP 2.3 (ERC20 ROUTE): FINALIZE ORDER STATE, UPDATE PROVIDER METRICS, AND EMIT RESOLUTION STATUS EVENT
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
        if (resolvedType === 'award') {
            await Provider.updateOne(
                { email: order.providerEmail },
                { $inc: { completedOrders: 1, totalTradeVolume: order.fiatAmount || 0 } }
            )
        }
        const statusQueue = new Queue('escrow-status-events')
        statusQueue.add('status-update', {
            orderId: order.orderId, status: 'resolved', resolutionType: resolvedType,
            sellerEmail: order.sellerEmail, providerEmail: order.providerEmail
        }, { removeOnComplete: true, removeOnFail: 50 })
        console.log(`[DISP-RESOLVE] ERC20 Complete:`, { orderId: order.orderId, type: resolvedType, txHash })
        return 'success'
    }

    // STEP 3 (NATIVE ROUTE): AUDIT PRIOR RESOLUTION PATTERNS AND VERIFY CONFIRMED FUNDING ON-CHAIN
    const amountWei = toWeiAmount(order.amount, decimals)
    const patternTx = await findPreviousResolutionTx(order.orderId, null, null)
    if (patternTx) {
        console.log('[DISP-RESOLVE] Resolution already processed (found via pattern txHash). Skipping on-chain transfer.', { orderId: order.orderId, txHash: patternTx.txHash })
        txHash = patternTx.txHash
    } else if (order.escrowTxHash && !order.escrowTxHash.startsWith('offchain-')) {
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
            const onTxHash = async (hash) => {
                console.log(`[DISP-RESOLVE] Pre-saving releaseTxHash ${hash} to prevent duplicate retries`)
                await EscrowOrder.updateOne({ orderId: order.orderId }, { $set: { releaseTxHash: hash } })
            }
            // STEP 4 (NATIVE ROUTE): DISPATCH ESCROW WALLET TRANSFER TO BENEFICIARY WITH ATOMIC PRE-SAVED HASH
            if (resolvedType === 'revert') {
                receipt = await interactor.refundFundsFromEscrowWallet(order.orderId, order.sellerWalletAddress, amountWei, onTxHash)
            } else {
                receipt = await interactor.awardFundsFromEscrowWallet(order.orderId, order.providerWalletAddress, amountWei, onTxHash)
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

    // STEP 5: REGISTER INTERNAL RESOLUTION TRANSACTION IF NON-CHAIN, UPDATE ORDER STATE, AND EMIT STATUS EVENT
    if (!txHash || !String(txHash).startsWith('0x')) {
        await registerResolutionTransaction(order, txHash, resolvedType)
    }
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


// PERIODICALLY POLLS DISPUTED ORDERS REQUIRING SETTLEMENT AND PROCESSES RESOLUTIONS SEQUENTIALLY
const checkDisputedOrders = async () => {
    try {
        // STEP 1: QUERY FOR DISPUTED ESCROW ORDERS REQUIRING SETTLEMENT
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
                // STEP 2: ATOMICALLY ACQUIRE RESOLUTION LOCK (RESOLVEDAT) TO PREVENT CONCURRENT PROCESSING
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
                // STEP 3: DISPATCH DISPUTE SETTLEMENT OR PRESERVE LOCK IF MANUAL REVIEW IS REQUIRED
                await processDisputeResolution(order)
            } catch (orderError) {
                console.error('[DISP-RESOLVE] Error processing order:', order.orderId, orderError.message)
                if (orderError.message.startsWith('MANUAL_REVIEW_REQUIRED')) {
                    console.error('[DISP-RESOLVE] Lock preserved for manual review. Admin must clear resolvedAt after verification.')
                } else {
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


// INITIALIZES DATABASE CONNECTION AND STARTS PERIODIC DISPUTE RESOLUTION POLLING LOOP
connectDB.then(() => {
    console.log('[DISP-RESOLVE] Worker started, polling every', POLL_INTERVAL_MS, 'ms')
    checkDisputedOrders()
    setInterval(checkDisputedOrders, POLL_INTERVAL_MS)
})
