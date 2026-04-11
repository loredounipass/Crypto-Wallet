const {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
} = require('./index')

const chainId = 11155420
const coin = 'OP'

const transactionsQueue = new Queue('op-transactions')

connectDB.then(async () => {
    const web3 = getWeb3WssInstance(process.env.OPTIMISM_WSS)
    const topic = web3.utils.sha3('DepositedOnBlockVault()')
    console.log('[SUB][OP] subscription started on chainId:', chainId)
    console.log('[SUB][OP] listening topic:', topic)

    const subscription = await web3.eth.subscribe('logs', {
        topics: [topic]
    })

    subscription.on('data', async (result) => {
        try {
            const eventAddress = (result.address || '').toLowerCase()
            console.log('[SUB][OP] log detected tx:', result.transactionHash, 'address:', result.address)

            const wallet = await Wallet.findOne({
                chainId,
                coin,
                $expr: {
                    $eq: [{ $toLower: '$address' }, eventAddress]
                }
            })

            if (!wallet) {
                console.log('[SUB][OP] no wallet match for address:', result.address)
                return
            }

            await transactionsQueue.add('transaction', {
                walletAddress: wallet.address,
                transactionHash: result.transactionHash,
                chainId,
                coin,
                uuid: uuidv4()
            }, {
                attempts: 2,
                backoff: {
                    type: 'exponential',
                    delay: 5000
                }
            })
            console.log('[SUB][OP] transaction queued tx:', result.transactionHash, 'wallet:', wallet.address)
        } catch (error) {
            console.error('[SUB][OP] data handler error:', error.message || error)
        }
    })

    subscription.on('error', (error) => {
        console.error('[SUB][OP] subscription error:', error.message || error)
    })
}).catch((error) => {
    console.error('[SUB][OP] DB connection error:', error.message || error)
})
