const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker } = require(`${appRoot}/config/bullmq`)
const { formatUnits } = require('ethers')

const EscrowContractInteractor = require(`${appRoot}/config/utils/EscrowContractInteractor`)
const coins = require(`${appRoot}/config/coins/info`)

const processGasEstimate = async (jobData) => {
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

    const gasMultiplier = BigInt(process.env.ESCROW_GAS_MULTIPLIER || '150')
    const totalGasWei = gasPrice * gasLimit * gasMultiplier / BigInt(100)
    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    const gasFee = Number(parseFloat(formatUnits(totalGasWei, decimals)).toFixed(8))

    console.log('[ESCROW-GAS-ESTIMATE] Result:', { coin, chainId, gasFee, gasFeeFormatted: gasFee.toFixed(8) })

    return { gasFee, gasFeeFormatted: gasFee.toFixed(8) }
}

connectDB.then(() => {
    new Worker('escrow-gas-estimate', async (job) => {
        return await processGasEstimate(job.data)
    })
    console.log('[ESCROW-GAS-ESTIMATE] Worker started and ready')
})
