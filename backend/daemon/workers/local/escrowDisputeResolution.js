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

const POLL_INTERVAL_MS = 30000



// CONVIERTE UNA CANTIDAD LEGIBLE A SU EQUIVALENTE EN WEI CONSIDERANDO LOS DECIMALES
const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}



// REGISTRA LA TRANSACCION RESULTANTE DE LA RESOLUCION DE LA DISPUTA A FAVOR DEL GANADOR
const registerResolutionTransaction = async (order, txHash, resolutionType) => {
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



// BUSCA UNA TRANSACCION PREVIA QUE COINCIDA CON LOS PATRONES DE RESOLUCION PARA EVITAR DUPLICADOS
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



// PROCESA LA TRANSFERENCIA DE FONDOS HACIA EL GANADOR DE LA DISPUTA Y ACTUALIZA LOS ESTADOS
const processDisputeResolution = async (order) => {
    const decimals = coins[String(order.coin || '').toUpperCase()]?.decimals || 18
    const interactor = new EscrowContractInteractor(order.chainId)
    const resolvedType = order.isReverted ? 'revert' : 'award'
    let txHash = null

    // ERC20 TOKEN DISPUTE RESOLUTION
    if (order.isToken && order.tokenAddress) {
        if (resolvedType === 'revert') {
            // Devolver al seller via Erc20Ledger (DB-only)
            const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
            await Erc20Ledger.updateOne(
                {
                    walletAddress: order.sellerWalletAddress.toLowerCase(),
                    tokenAddress: order.tokenAddress.toLowerCase(),
                    chainId: order.chainId
                },
                { $inc: { available_balance: order.amount } }
            )
            txHash = `internal-resolve-revert-${order.orderId}`
            console.log('[DISP-RESOLVE] ERC20 token revert to seller ledger:', {
                orderId: order.orderId, amount: order.amount, tokenAddress: order.tokenAddress
            })
        } else {
            // Award: enviar ERC20 al provider on-chain
            const tokenInfo = getTokenInfo(order.chainId, order.tokenAddress)
            const tokenDecimals = tokenInfo?.decimals || 6
            const onTxHash = async (hash) => {
                console.log(`[DISP-RESOLVE] Pre-saving releaseTxHash ${hash} to prevent duplicate retries`)
                await EscrowOrder.updateOne({ orderId: order.orderId }, { $set: { releaseTxHash: hash } })
            }
            const receipt = await interactor.sendERC20Transfer(
                order.tokenAddress, order.providerWalletAddress, order.amount, tokenDecimals, onTxHash
            )
            if (!receipt || !receipt.status) {
                throw new Error(`ERC20 award transfer failed for order ${order.orderId}`)
            }
            txHash = receipt.transactionHash
            console.log('[DISP-RESOLVE] ERC20 token award to provider:', {
                orderId: order.orderId, txHash, amount: order.amount
            })
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

    // NATIVE COIN DISPUTE RESOLUTION (unchanged)
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
    await registerResolutionTransaction(order, txHash, resolvedType)
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



// VERIFICA CONTINUAMENTE LA BASE DE DATOS EN BUSCA DE ORDENES EN DISPUTA MARCADAS PARA RESOLUCION
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

connectDB.then(() => {
    console.log('[DISP-RESOLVE] Worker started, polling every', POLL_INTERVAL_MS, 'ms')
    checkDisputedOrders()
    setInterval(checkDisputedOrders, POLL_INTERVAL_MS)
})
