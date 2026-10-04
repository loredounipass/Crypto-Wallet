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



// CONVIERTE UNA CANTIDAD LEGIBLE A SU EQUIVALENTE EN WEI CONSIDERANDO LOS DECIMALES
const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}



// REGISTRA LA TRANSACCION DE FONDEO DEL ESCROW ASOCIANDOLA A LA BILLETERA DEL VENDEDOR
const registerEscrowFundingTransaction = async (order, escrowTxHash, escrowTargetAddress) => {
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



// PROCESA EL FONDEO DE LA ORDEN DE ESCROW TRANSFIRIENDO LOS FONDOS DESDE LA BILLETERA CALIENTE
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

    // ERC20 TOKEN: skip on-chain transfer (balance already deducted from Erc20Ledger in createOrder)
    if (isToken && tokenAddress) {
        const offchainTxHash = `offchain-ledger-${orderId}`
        await EscrowOrder.updateOne({ orderId }, {
            $set: {
                escrowTxHash: offchainTxHash,
                fundingMethod: 'offchain-ledger',
                status: 'funded'
            }
        })
        const statusQueue = new Queue('escrow-status-events')
        statusQueue.add('status-update', {
            orderId, status: 'funded', sellerEmail, providerEmail, escrowTxHash: offchainTxHash
        }, { removeOnComplete: true, removeOnFail: 50 })
        console.log('[ESCROW-FUNDING] ERC20 token order funded via offchain-ledger:', { orderId, tokenAddress })
        return 'success'
    }

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

    if (escrowTxHash && !order.fundingMethod) {
        // Tenemos un hash pendiente del intento anterior — verificar en cadena
        console.log(`[ESCROW-FUNDING] Found pending escrowTxHash ${escrowTxHash}. Checking status...`)
        let chainReceipt = null
        let receiptMissing = false
        try {
            chainReceipt = await interactor.web3.eth.getTransactionReceipt(escrowTxHash)
        } catch (e) {
            // web3 v4 lanza TransactionNotFound cuando el hash se pre-guardo pero nunca se broadcasteo
            if (e.message && (e.message.includes('Transaction not found') || e.message.includes('not found'))) {
                receiptMissing = true
            } else {
                throw new Error('WAITING_FOR_FUNDING_CONFIRMATION')
            }
        }
        if (receiptMissing || chainReceipt === null) {
            // Confirmar que la tx no exista en mempool antes de declararla stale
            let txExists = false
            let txNonce = null
            try {
                const tx = await interactor.web3.eth.getTransaction(escrowTxHash)
                txExists = !!tx
                if (txExists) txNonce = Number(tx.nonce)
            } catch (e) {
                txExists = false
            }
            if (!txExists) {
                console.log(`[ESCROW-FUNDING] Stale pre-saved hash ${escrowTxHash} never broadcast. Clearing and retrying fresh...`)
                await EscrowOrder.updateOne({ orderId }, { $unset: { escrowTxHash: '' } })
                escrowTxHash = null
            } else if (txNonce !== null) {
                // Tx en mempool sin minar con nonce muy por encima del real = huerfana por gap, nunca minara
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
    if (!escrowTxHash) {
        // Primera ejecucion o reintento tras limpiar hash stale: enviar fondos y pre-guardar hash
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
    new Worker('escrow-funding', async (job) => {
        return await processEscrowFunding(job.data)
    }, { concurrency: 15 })
    console.log('[ESCROW-FUNDING] Worker started and ready')
})
