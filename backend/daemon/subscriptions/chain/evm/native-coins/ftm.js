const { connectDB, connectAndSubscribe } = require('./index')

connectDB.then(async () => {
    await connectAndSubscribe({
        chainId: 4002,
        coin: 'FTM',
        wssUrl: process.env.FANTOM_WSS,
        queueName: 'ftm-transactions'
    })
}).catch((error) => {
    console.error('[SUB][FTM] DB connection error:', error.message || error)
})
