const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker } = require(`${appRoot}/config/bullmq`)
const { parseUnits } = require('ethers')

const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)
const coins = require(`${appRoot}/config/coins/info`)

const processRefund = async (jobData) => {
    const { orderId, chainId, sellerWalletAddress, amount, coin } = jobData
    console.log('[ESCROW-REFUND] Processing:', { orderId, chainId, seller: sellerWalletAddress?.slice(0, 10) })

    const interactor = new EscrowContractInteractor(chainId)
    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const amountWei = parseUnits(String(amount), decimals)
    let refunded = false
    let refundTxHash = null

    const contractAvailable = await interactor.isContractAvailable()
    const useEscrowContract = process.env.ESCROW_USE_CONTRACT === 'true'

    // Strategy 1: Contract refund
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

    // Strategy 2: Top up escrow wallet if needed, then refund
    if (!refunded) {
        try {
            await interactor.ensureEscrowWalletBalanceForTransfer(orderId, sellerWalletAddress, amountWei)
            const receipt = await interactor.refundFundsFromEscrowWallet(orderId, sellerWalletAddress, amountWei)
            if (receipt && receipt.status) {
                refunded = true
                refundTxHash = receipt.transactionHash
                console.log(`[ESCROW-REFUND] Escrow wallet refund successful.`)
            }
        } catch (err) {
            console.warn(`[ESCROW-REFUND] Escrow wallet refund failed:`, err.message)
        }
    }

    // Strategy 3: Direct hot wallet → seller
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
    })
    console.log('[ESCROW-REFUND] Worker started and ready')
})
