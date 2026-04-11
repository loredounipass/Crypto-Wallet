const {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
} = require('./index')

const chainId = 43113
const coin = 'AVAX'

const transactionsQueue = new Queue('avax-transactions')

connectDB.then(async () => {
    const web3 = getWeb3WssInstance(process.env.AVALANCHE_WSS)
    const topic = web3.utils.sha3('DepositedOnMetaDapp()')
    console.log('[SUB][AVAX] subscription started on chainId:', chainId)
    console.log('[SUB][AVAX] listening topic:', topic)

    const subscription = await web3.eth.subscribe('logs', {
        topics: [topic]
    })

    subscription.on('data', async (result) => {
        try {
            const eventAddress = (result.address || '').toLowerCase()
            console.log('[SUB][AVAX] log detected tx:', result.transactionHash, 'address:', result.address)

            const wallet = await Wallet.findOne({
                chainId,
                coin,
                $expr: {
                    $eq: [{ $toLower: '$address' }, eventAddress]
                }
            })

            if (!wallet) {
                console.log('[SUB][AVAX] no wallet match for address:', result.address)
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
            console.log('[SUB][AVAX] transaction queued tx:', result.transactionHash, 'wallet:', wallet.address)
        } catch (error) {
            console.error('[SUB][AVAX] data handler error:', error.message || error)
        }
    })

    subscription.on('error', (error) => {
        console.error('[SUB][AVAX] subscription error:', error.message || error)
    })
}).catch((error) => {
    console.error('[SUB][AVAX] DB connection error:', error.message || error)
})
