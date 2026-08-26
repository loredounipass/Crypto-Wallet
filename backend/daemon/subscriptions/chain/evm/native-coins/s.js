const { connectDB, connectAndSubscribe } = require('./index')

connectDB.then(async () => {
    await connectAndSubscribe({
        chainId: 14601,
        coin: 'S',
        wssUrl: process.env.SONIC_WSS,
        queueName: 's-transactions'
    })
}).catch((error) => {
    console.error('[SUB][S] DB connection error:', error.message || error)
})
