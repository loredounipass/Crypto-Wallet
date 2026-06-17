const { connectDB, connectAndSubscribe } = require('./index')

connectDB.then(async () => {
    await connectAndSubscribe({
        chainId: 43113,
        coin: 'AVAX',
        wssUrl: process.env.AVALANCHE_WSS,
        queueName: 'avax-transactions'
    })
}).catch((error) => {
    console.error('[SUB][AVAX] DB connection error:', error.message || error)
})
