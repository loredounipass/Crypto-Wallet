const appRoot = require('app-root-path')
const { Worker } = require(`${appRoot}/config/bullmq`)
const {
    connectDB,
    createTransaction,
    processDeposit,
    processWithdraw
} = require('./index')

connectDB.then(() => {
    new Worker('op-transactions', async (job) => {
        return await createTransaction(job.data)
    })

    new Worker('op-deposits', async (job) => {
        return await processDeposit(job.data)
    }, { concurrency: 15 })

    new Worker('op-withdraws', async (job) => {
        return await processWithdraw(job.data)
    })

})