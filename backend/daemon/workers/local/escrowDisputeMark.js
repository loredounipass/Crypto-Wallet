const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker } = require(`${appRoot}/config/bullmq`)

const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)
const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)

const processDisputeMark = async (jobData) => {
    const { orderId, chainId, escrowTxHash } = jobData
    console.log('[ESCROW-DISPUTE-MARK] Processing:', { orderId, chainId })

    if (!escrowTxHash) {
        console.log('[ESCROW-DISPUTE-MARK] No escrow tx hash, skipping on-chain marking')
        return 'skipped'
    }

    const useEscrowContract = process.env.ESCROW_USE_CONTRACT === 'true'
    if (!useEscrowContract) {
        console.log('[ESCROW-DISPUTE-MARK] Escrow contract disabled, skipping')
        return 'skipped'
    }

    const interactor = new EscrowContractInteractor(chainId)
    const contractAvailable = await interactor.isContractAvailable()
    if (!contractAvailable) {
        console.log('[ESCROW-DISPUTE-MARK] Contract not available on chain', chainId)
        return 'skipped'
    }

    console.log(`[ESCROW-DISPUTE-MARK] Marking order ${orderId} as disputed on-chain...`)
    await interactor.markDisputedOnChain(orderId)
    console.log(`[ESCROW-DISPUTE-MARK] Order ${orderId} marked as disputed on-chain successfully`)
    return 'success'
}

connectDB.then(() => {
    new Worker('escrow-dispute-mark', async (job) => {
        return await processDisputeMark(job.data)
    })
    console.log('[ESCROW-DISPUTE-MARK] Worker started and ready')
})
