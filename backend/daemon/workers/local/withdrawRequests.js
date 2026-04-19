const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const sendWithdraw = require(`${appRoot}/jobs/withdraws/transaction`)
const { Worker } = require(`${appRoot}/config/bullmq`)

connectDB.then(() => {
    console.log('[WITHDRAW-REQUESTS] Worker started and ready')
    new Worker('withdraw-requests', async (job) => {
        console.log(`[WITHDRAW-REQUESTS] Processing job ${job.id}`)
        try {
            const result = await sendWithdraw(job.data)
            console.log(`[WITHDRAW-REQUESTS] Job ${job.id} completed with result: ${result}`)
            return result
        } catch (error) {
            console.error(`[WITHDRAW-REQUESTS] Job ${job.id} failed:`, error.message || error)
            throw error
        }
    })
})