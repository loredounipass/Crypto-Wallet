const { connectDB, connectAndSubscribe } = require('./index')

connectDB.then(async () => {
    await connectAndSubscribe({
        chainId: 80002,
        coin: 'MATIC',
        wssUrl: process.env.POLYGON_WSS,
        queueName: 'matic-transactions'
    })
}).catch((error) => {
    console.error('[SUB][MATIC] DB connection error:', error.message || error)
})
