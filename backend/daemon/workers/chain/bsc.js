const appRoot = require('app-root-path')
const { Worker } = require(`${appRoot}/config/bullmq`)
const {
    connectDB,
    createTransaction,
    processDeposit,
    processWithdraw
} = require('./index')

connectDB.then(() => {
    new Worker('bnb-transactions', async (job) => {
        return await createTransaction(job.data)
    })

    new Worker('bnb-deposits', async (job) => {
        return await processDeposit(job.data)
    }, { concurrency: 15 })

    new Worker('bnb-withdraws', async (job) => {
        return await processWithdraw(job.data)
    })

})