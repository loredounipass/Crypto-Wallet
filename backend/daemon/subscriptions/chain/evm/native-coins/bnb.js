const { connectDB, connectAndSubscribe } = require('./index')

connectDB.then(async () => {
    await connectAndSubscribe({
        chainId: 97,
        coin: 'BNB',
        wssUrl: process.env.BSC_WSS,
        queueName: 'bnb-transactions'
    })
}).catch((error) => {
    console.error('[SUB][BNB] DB connection error:', error.message || error)
})
