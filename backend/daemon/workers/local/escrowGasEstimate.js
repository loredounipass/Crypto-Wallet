const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker } = require(`${appRoot}/config/bullmq`)
const { formatUnits } = require('ethers')

const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)
const coins = require(`${appRoot}/config/coins/info`)


// ESTIMATES GAS COSTS FOR ESCROW CONTRACT TRANSACTIONS WITH BUFFER AND DYNAMIC MULTIPLIER
const processGasEstimate = async (jobData) => {
    // STEP 1: RESOLVE ON-CHAIN GAS PRICE AND ESTIMATE GAS LIMIT WITH SAFETY BUFFER
    const { coin, chainId } = jobData
    console.log('[ESCROW-GAS-ESTIMATE] Processing:', { coin, chainId })
    const interactor = new EscrowContractInteractor(chainId)
    const gasPrice = BigInt(await interactor.web3.eth.getGasPrice())
    let gasLimit
    try {
        const from = interactor.hotWalletAddress || interactor.relayerAddress
        const to = interactor.escrowWalletAddress
        gasLimit = BigInt(await interactor.web3.eth.estimateGas({ from, to, value: '0' }))
        gasLimit = gasLimit * BigInt(120) / BigInt(100)
    } catch {
        gasLimit = BigInt(30000)
    }

    // STEP 2: APPLY MULTIPLIER BUFFER AND FORMAT ESTIMATED GAS FEE TO COIN DECIMALS
    const gasMultiplier = BigInt(process.env.ESCROW_GAS_MULTIPLIER || '150')
    const totalGasWei = gasPrice * gasLimit * gasMultiplier / BigInt(100)
    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const gasFee = Number(parseFloat(formatUnits(totalGasWei, decimals)).toFixed(8))
    console.log('[ESCROW-GAS-ESTIMATE] Result:', { coin, chainId, gasFee, gasFeeFormatted: gasFee.toFixed(8) })
    return { gasFee, gasFeeFormatted: gasFee.toFixed(8) }
}


// INITIALIZES DATABASE CONNECTION AND STARTS CONCURRENT GAS ESTIMATION BULLMQ WORKER
connectDB.then(() => {
    new Worker('escrow-gas-estimate', async (job) => {
        return await processGasEstimate(job.data)
    }, { concurrency: 15 })
    console.log('[ESCROW-GAS-ESTIMATE] Worker started and ready')
})
