const {
    Worker,
    connectDB,
    createTransaction,
    processDeposit,
    processWithdraw
} = require('./index')

connectDB.then(() => {
    new Worker('s-transactions', async (job) => {
        return await createTransaction(job.data)
    })

    new Worker('s-deposits', async (job) => {
        return await processDeposit(job.data)
    })

    new Worker('s-withdraws', async (job) => {
        return await processWithdraw(job.data)
    })

})
