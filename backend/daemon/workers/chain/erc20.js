const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Worker } = require(`${appRoot}/config/bullmq`)
const processERC20Event = require(`${appRoot}/jobs/deposits/erc20-processor`)
const processAggregation = require(`${appRoot}/jobs/deposits/erc20-aggregator`)
const processForwardExecution = require(`${appRoot}/jobs/withdraws/erc20-forward`)

connectDB.then(() => {
    console.log('[ERC20-WORKERS] Conectado a MongoDB. Levantando colas de procesamiento...')

    new Worker('erc20-processing', async (job) => {
        return await processERC20Event(job)
    })

    new Worker('erc20-aggregation', async (job) => {
        return await processAggregation(job)
    })

    new Worker('erc20-forwarding', async (job) => {
        return await processForwardExecution(job)
    })

}).catch(err => {
    console.error('[ERC20-WORKERS] Error conectando a BD:', err)
})
