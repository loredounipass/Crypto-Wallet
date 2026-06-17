const { connectDB, connectAndSubscribe } = require('./index')

connectDB.then(async () => {
    await connectAndSubscribe({
        chainId: 11155111,
        coin: 'ETH',
        wssUrl: process.env.ETHEREUM_WSS,
        queueName: 'eth-transactions'
    })
}).catch((error) => {
    console.error('[SUB][ETH] DB connection error:', error.message || error)
})
