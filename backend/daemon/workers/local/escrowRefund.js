const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker } = require(`${appRoot}/config/bullmq`)
const { parseUnits } = require('ethers')

const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)
const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
const coins = require(`${appRoot}/config/coins/info`)



// PROCESA EL REEMBOLSO DE FONDOS INTENTANDO DIFERENTES ESTRATEGIAS DE TRANSFERENCIA HASTA TENER EXITO
const processRefund = async (jobData) => {
    const { orderId, chainId, sellerWalletAddress, amount, coin } = jobData
    console.log('[ESCROW-REFUND] Processing:', { orderId, chainId, seller: sellerWalletAddress?.slice(0, 10) })

    // ERC20 TOKEN: return balance to Erc20Ledger (no on-chain refund needed)
    const order = await EscrowOrder.findOne({ orderId })
    if (order && order.isToken && order.tokenAddress) {
        // CLAIM ATOMICO: solo el primer intento acredita; reintentos reusan la marca
        const internalTxHash = `internal-token-refund-${orderId}`
        const claimed = await EscrowOrder.findOneAndUpdate(
            { orderId, refundTxHash: { $exists: false } },
            { $set: { refundTxHash: internalTxHash } }
        )
        if (!claimed) {
            console.log('[ESCROW-REFUND] ERC20 refund already processed, skipping:', { orderId })
            return internalTxHash
        }
        await Erc20Ledger.updateOne(
            {
                walletAddress: order.sellerWalletAddress.toLowerCase(),
                tokenAddress: order.tokenAddress.toLowerCase(),
                chainId: order.chainId
            },
            { $inc: { available_balance: order.amount } }
        )
        console.log('[ESCROW-REFUND] ERC20 token refund to ledger complete:', {
            orderId, amount: order.amount, tokenAddress: order.tokenAddress
        })
        return `internal-token-refund-${orderId}`
    }

    const interactor = new EscrowContractInteractor(chainId)
    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const amountWei = parseUnits(String(amount), decimals)
    let refunded = false
    let refundTxHash = null
    const contractAvailable = await interactor.isContractAvailable()
    const useEscrowContract = process.env.ESCROW_USE_CONTRACT === 'true'
    if (useEscrowContract && contractAvailable) {
        try {
            console.log(`[ESCROW-REFUND] Refunding order ${orderId} via escrow contract...`)
            const receipt = await interactor.refundFundsOnChain(orderId)
            if (receipt && receipt.status) {
                refunded = true
                refundTxHash = receipt.transactionHash
                console.log(`[ESCROW-REFUND] Contract refund successful.`)
            }
        } catch (err) {
            console.warn(`[ESCROW-REFUND] Contract refund failed:`, err.message)
        }
    }
    if (!refunded) {
        try {
            await interactor.ensureEscrowWalletBalanceForTransfer(orderId, sellerWalletAddress, amountWei)
            const onTxHash = async (hash) => {
                console.log(`[ESCROW-REFUND] Pre-saving refundTxHash ${hash} to prevent duplicate retries`)
                refundTxHash = hash
            }
            const receipt = await interactor.refundFundsFromEscrowWallet(orderId, sellerWalletAddress, amountWei, onTxHash)
            if (receipt && receipt.status) {
                refunded = true
                refundTxHash = receipt.transactionHash
                console.log(`[ESCROW-REFUND] Escrow wallet refund successful.`)
            }
        } catch (err) {
            console.warn(`[ESCROW-REFUND] Escrow wallet refund failed:`, err.message)
        }
    }
    if (!refunded && interactor.hotWalletAddress) {
        try {
            console.log(`[ESCROW-REFUND] Last resort: refunding from hot wallet directly...`)
            const receipt = await interactor._sendNativeTransfer(
                interactor.hotWalletAddress,
                interactor.hotWalletPrivateKey,
                sellerWalletAddress,
                amountWei,
            )
            if (receipt && receipt.status) {
                refunded = true
                refundTxHash = receipt.transactionHash
                console.log(`[ESCROW-REFUND] Hot wallet direct refund successful.`)
            }
        } catch (err) {
            console.warn(`[ESCROW-REFUND] Hot wallet direct refund failed:`, err.message)
        }
    }
    if (!refunded) {
        throw new Error('[ESCROW-REFUND] All refund strategies failed')
    }
    console.log('[ESCROW-REFUND] Complete:', { orderId, refundTxHash })
    return refundTxHash
}

connectDB.then(() => {
    new Worker('escrow-refund', async (job) => {
        return await processRefund(job.data)
    }, { concurrency: 15 })
    console.log('[ESCROW-REFUND] Worker started and ready')
})
