const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker, Queue } = require(`${appRoot}/config/bullmq`)
const { parseUnits } = require('ethers')
const ObjectId = require('mongoose').Types.ObjectId

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Provider = require(`${appRoot}/config/models/Provider`)
const coins = require(`${appRoot}/config/coins/info`)
const { getTokenInfo } = require(`${appRoot}/config/tokens`)
const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)



// CONVIERTE UNA CANTIDAD LEGIBLE A SU EQUIVALENTE EN WEI CONSIDERANDO LOS DECIMALES
const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}



// REGISTRA LA TRANSACCION DE LIBERACION ASOCIANDOLA A LA BILLETERA DEL PROVEEDOR
// DEPRECADO: no llamar desde processEscrowRelease. La subscription WSS nativa
// (DepositedOnMetaDapp -> transaction.js -> deposit.js) es la unica creadora del
// documento Transaction para el releaseTxHash. Crear otro aqui genera duplicados
// en UI (mismo txHash, 2 docs) porque txHash no tiene indice unico.
// Se conserva solo como fallback idempotente via upsert por si se necesita.
const registerEscrowReleaseTransaction = async (order, releaseTxHash) => {
    const coin = String(order.coin || '').toUpperCase()
    const providerAddress = String(order.providerWalletAddress || '').toLowerCase()
    const chainId = Number(order.chainId)
    const wallet = await Wallet.findOne({
        address: new RegExp(`^${providerAddress}$`, 'i'),
        coin,
        chainId
    })
    if (!wallet) {
        console.warn('[ESCROW-RELEASE] Provider wallet not found for escrow transaction registration:', {
            orderId: order.orderId,
            providerAddress,
            coin,
            chainId
        })
        return null
    }
    const normalizedHash = String(releaseTxHash).toLowerCase()
    const transaction = await Transaction.findOneAndUpdate(
        { txHash: normalizedHash },
        {
            $setOnInsert: {
                nature: 1,
                amount: Number(order.amount || 0),
                created_at: Date.now(),
                status: 1,
                confirmations: 0,
                txHash: normalizedHash,
                to: order.providerWalletAddress
            }
        },
        { upsert: true, returnDocument: 'after' }
    )
    await Wallet.updateOne(
        { _id: new ObjectId(wallet._id) },
        { $addToSet: { transactions: transaction._id } }
    )
    console.log('[ESCROW-RELEASE] Registered release tx for confirmation tracking:', {
        orderId: order.orderId,
        txHash: releaseTxHash,
        transactionId: transaction._id.toString()
    })
    return transaction
}



// EJECUTA LA TRANSFERENCIA DE LOS FONDOS RETENIDOS HACIA LA BILLETERA DEL PROVEEDOR Y ACTUALIZA SUS ESTADISTICAS
const processEscrowRelease = async (jobData) => {
    const {
        orderId, providerWalletAddress, sellerWalletAddress,
        amount, coin, chainId, sellerEmail, providerEmail,
        isToken, tokenAddress
    } = jobData
    console.log('[ESCROW-RELEASE] Processing release:', {
        orderId, amount, coin, chainId,
        provider: providerWalletAddress?.slice(0, 10) + '...'
    })
    const order = await EscrowOrder.findOne({ orderId })
    if (!order || order.status !== 'released') {
        console.error(`[ESCROW-RELEASE] Invalid order state: ${order?.status || 'not found'}`)
        throw new Error(`[ESCROW-RELEASE] Invalid order state: ${order?.status || 'not found'}`)
    }
    let releaseTxHash = order.releaseTxHash
    const interactor = new EscrowContractInteractor(chainId)

    if (releaseTxHash && order.status !== 'completed') {
        console.log(`[ESCROW-RELEASE] Found pending releaseTxHash ${releaseTxHash}. Checking status...`)
        let receipt = null
        let txMissing = false
        try {
            receipt = await interactor.web3.eth.getTransactionReceipt(releaseTxHash)
        } catch (e) {
            // web3 v4 lanza TransactionNotFound cuando el hash nunca se broadcasteo (pre-save huerfano)
            if (e.message && (e.message.includes('Transaction not found') || e.message.includes('not found'))) {
                txMissing = true
            } else {
                console.warn(`[ESCROW-RELEASE] Error checking receipt for ${releaseTxHash}:`, e.message)
                throw new Error('WAITING_FOR_RELEASE_CONFIRMATION')
            }
        }
        if (txMissing || receipt === null) {
            // Verificar si la tx existe en mempool antes de declararla stale
            let txExists = false
            let txNonce = null
            try {
                const tx = await interactor.web3.eth.getTransaction(releaseTxHash)
                txExists = !!tx
                if (txExists) txNonce = Number(tx.nonce)
            } catch (e) {
                txExists = false
            }
            if (!txExists) {
                console.log(`[ESCROW-RELEASE] Stale pre-saved hash ${releaseTxHash} never broadcast. Clearing and retrying fresh...`)
                await EscrowOrder.updateOne({ orderId }, { $unset: { releaseTxHash: '' } })
                releaseTxHash = null
            } else if (txNonce !== null) {
                // Tx en mempool pero sin minar: si su nonce esta muy por encima del nonce real, quedo huerfana por gap (nunca minara)
                const chainNonce = Number(await interactor.web3.eth.getTransactionCount(interactor.hotWalletAddress, 'pending'))
                if (txNonce > chainNonce + 5) {
                    console.log(`[ESCROW-RELEASE] Orphaned tx ${releaseTxHash} nonce=${txNonce} chainNonce=${chainNonce}. Clearing hash + resetting TxManager...`)
                    await EscrowOrder.updateOne({ orderId }, { $unset: { releaseTxHash: '' } })
                    const TxManager = require(`${appRoot}/config/utils/TxManager`)
                    await TxManager.resetNonce(interactor.hotWalletAddress, interactor.chainId)
                    releaseTxHash = null
                } else {
                    console.log(`[ESCROW-RELEASE] Existing tx ${releaseTxHash} is still pending on chain`)
                    throw new Error('WAITING_FOR_RELEASE_CONFIRMATION')
                }
            } else {
                console.log(`[ESCROW-RELEASE] Existing tx ${releaseTxHash} is still pending on chain`)
                throw new Error('WAITING_FOR_RELEASE_CONFIRMATION')
            }
        } else if (receipt) {
            if (receipt.status) {
                console.log(`[ESCROW-RELEASE] Previously pending tx ${releaseTxHash} succeeded!`)
            } else {
                console.error(`[ESCROW-RELEASE] Previous tx ${releaseTxHash} failed on chain`)
                await EscrowOrder.updateOne({ orderId }, { $unset: { releaseTxHash: '' } })
                releaseTxHash = null
            }
        }
    } else if (order.status === 'completed') {
        console.log(`[ESCROW-RELEASE] Order ${orderId} already released, skipping`)
        return 'success'
    }
    if (!releaseTxHash || order.status !== 'completed') {
        if (!releaseTxHash) {
            if (order.escrowTxHash && !order.escrowTxHash.startsWith('offchain-')) {
                const fundingTx = await Transaction.findOne({ txHash: order.escrowTxHash })
                if (!fundingTx || fundingTx.status !== 3) {
                    console.log(`[ESCROW-RELEASE] Funding transaction ${order.escrowTxHash} is still pending confirmations (Status: ${fundingTx?.status || 'not found'}). Retrying later...`)
                    throw new Error('WAITING_FOR_FUNDING_CONFIRMATIONS')
                }
                console.log(`[ESCROW-RELEASE] Funding transaction confirmed. Proceeding with release...`)
            }
            const onTxHash = async (txHash) => {
                releaseTxHash = txHash
                console.log(`[ESCROW-RELEASE] Pre-saving txHash ${txHash} to prevent duplicate retries`)
                await EscrowOrder.updateOne(
                    { orderId },
                    { $set: { releaseTxHash: txHash } }
                )
            }

            // BIFURCAR: ERC20 vs NATIVO
            if (!coin) throw new Error('[ESCROW-RELEASE] Coin is undefined, cannot determine decimals')
            const isErc20Token = isToken || (order && order.isToken)
            const theTokenAddress = tokenAddress || (order && order.tokenAddress)
            if (order && order.isToken && !theTokenAddress) {
                throw new Error('[ESCROW-RELEASE] Missing tokenAddress for ERC20 order, refusing native fallback')
            }

            if (isErc20Token && theTokenAddress) {
                // Obtener decimales correctos del token (USDC=6, USDT=6, etc)
                const tokenInfo = getTokenInfo(chainId, theTokenAddress)
                const tokenDecimals = tokenInfo?.decimals ?? 18
                console.log('[ESCROW-RELEASE] Releasing ERC20 token from hot wallet...', { tokenDecimals, token: theTokenAddress })
                let receipt = null
                try {
                    receipt = await interactor.sendERC20Transfer(
                        theTokenAddress, providerWalletAddress, amount, tokenDecimals, onTxHash
                    )
                } catch (e) {
                    // Si hot no tiene liquidez, los fondos siguen en el contrato del seller: forwardear y reintentar una vez
                    if (e.message && e.message.includes('Insufficient ERC20 balance in hot wallet')) {
                        console.log('[ESCROW-RELEASE] Hot wallet short on ERC20, forwarding from seller contract and retrying...', { orderId })
                        await interactor.forwardSellerERC20ToHotWallet(order.sellerWalletAddress, theTokenAddress)
                        const MAX_POLLS = 10
                        for (let i = 0; i < MAX_POLLS; i++) {
                            try {
                                receipt = await interactor.sendERC20Transfer(
                                    theTokenAddress, providerWalletAddress, amount, tokenDecimals, onTxHash
                                )
                                break
                            } catch (retryErr) {
                                if (retryErr.message && retryErr.message.includes('Insufficient ERC20 balance in hot wallet') && i < MAX_POLLS - 1) {
                                    await new Promise(r => setTimeout(r, 3000))
                                    continue
                                }
                                throw retryErr
                            }
                        }
                    } else {
                        throw e
                    }
                }
                if (!receipt || !receipt.status) {
                    console.error('[ESCROW-RELEASE] ERC20 transfer failed')
                    throw new Error('[ESCROW-RELEASE] ERC20 transfer failed')
                }
                releaseTxHash = receipt.transactionHash
                console.log('[ESCROW-RELEASE] ERC20 transfer successful:', { orderId, txHash: releaseTxHash })
            } else {
                const decimals = coins[coin.toUpperCase()]?.decimals || 18
                const amountWei = toWeiAmount(amount, decimals)
                console.log('[ESCROW-RELEASE] Releasing via escrow wallet native transfer...')
                await interactor.ensureEscrowWalletBalanceForTransfer(orderId, providerWalletAddress, amountWei)
                const receipt = await interactor.releaseFundsFromEscrowWallet(orderId, providerWalletAddress, amountWei, onTxHash)
                if (!receipt || !receipt.status) {
                    console.error('[ESCROW-RELEASE] Escrow wallet transfer failed')
                    throw new Error('[ESCROW-RELEASE] Escrow wallet transfer failed')
                }
                releaseTxHash = receipt.transactionHash
                console.log('[ESCROW-RELEASE] Escrow wallet transfer successful:', { orderId, txHash: releaseTxHash })
            }
        }
    }
    await EscrowOrder.updateOne(
        { orderId },
        {
            $set: {
                status: 'completed',
                releaseTxHash
            }
        }
    )
    // NOTA: no crear Transaction aqui. La subscription WSS on-chain detecta esta
    // transferencia al wallet del provider y crea el unico documento via
    // transaction.js -> deposit.js. Crear otro aqui duplicaba el deposito en UI
    // (mismo txHash, 2 docs) porque txHash no tiene indice unico. Ver fix 2026-08-21
    // revertido por error en 2026-10-03 al agregar soporte ERC20.
    const providerResult = await Provider.updateOne(
        { email: providerEmail },
        {
            $inc: {
                completedOrders: 1,
                totalTradeVolume: order.fiatAmount || 0
            }
        }
    )
    if (providerResult.matchedCount === 0) {
        console.warn('[ESCROW-RELEASE] Provider not found for stats update:', { orderId, providerEmail })
    }
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
    console.log('[ESCROW-RELEASE] Worker started and ready')
    new Worker('escrow-release', async (job) => {
        console.log(`[ESCROW-RELEASE] Processing job ${job.id}`)
        try {
            const result = await processEscrowRelease(job.data)
            console.log(`[ESCROW-RELEASE] Job ${job.id} completed with result: ${result}`)
            return result
        } catch (error) {
            console.error(`[ESCROW-RELEASE] Job ${job.id} failed:`, error.message || error)
            throw error
        }
    }, { concurrency: 15 })
})
