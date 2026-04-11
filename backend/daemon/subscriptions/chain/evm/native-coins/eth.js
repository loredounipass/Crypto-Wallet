const {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
} = require('./index')

const chainId = 11155111
const coin = 'ETH'

const transactionsQueue = new Queue('eth-transactions')

connectDB.then(async () => {
    const web3 = getWeb3WssInstance(process.env.ETHEREUM_WSS)
    const topic = web3.utils.sha3('DepositedOnMetaDapp()')
    console.log('[SUB][ETH] subscription started on chainId:', chainId)
    console.log('[SUB][ETH] listening topic:', topic)

    const subscription = await web3.eth.subscribe('logs', {
        topics: [topic]
    })

    subscription.on('data', async (result) => {
        try {
            const eventAddress = (result.address || '').toLowerCase()
            console.log('[SUB][ETH] log detected tx:', result.transactionHash, 'address:', result.address)

            const wallet = await Wallet.findOne({
                chainId,
                coin,
                $expr: {
                    $eq: [{ $toLower: '$address' }, eventAddress]
                }
            })

            if (!wallet) {
                console.log('[SUB][ETH] no wallet match for address:', result.address)
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
            console.log('[SUB][ETH] transaction queued tx:', result.transactionHash, 'wallet:', wallet.address)
        } catch (error) {
            console.error('[SUB][ETH] data handler error:', error.message || error)
        }
    })

    subscription.on('error', (error) => {
        console.error('[SUB][ETH] subscription error:', error.message || error)
    })
}).catch((error) => {
    console.error('[SUB][ETH] DB connection error:', error.message || error)
})


