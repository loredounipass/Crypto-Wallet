const { connectDB, connectAndSubscribe } = require('./index')

connectDB.then(async () => {
    await connectAndSubscribe({
        chainId: 11155420,
        coin: 'OP',
        wssUrl: process.env.OPTIMISM_WSS,
        queueName: 'op-transactions'
    })
}).catch((error) => {
    console.error('[SUB][OP] DB connection error:', error.message || error)
})
