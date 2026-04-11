const {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
} = require('./index')

const chainId = 80002
const coin = 'MATIC'

const transactionsQueue = new Queue('matic-transactions')

connectDB.then(() => {
    const web3 = getWeb3WssInstance(process.env.POLYGON_WSS)
    console.log('[SUB][MATIC] subscription started on chainId:', chainId)

    web3.eth.subscribe('logs', {
        topics: [
            web3.utils.sha3('DepositedOnMetaDapp()')
        ]
    }, async function (error, result) {
        if (error) {
            console.error('[SUB][MATIC] subscription error:', error.message || error)
            return
        }

        console.log('[SUB][MATIC] log detected tx:', result.transactionHash, 'address:', result.address)
        Wallet.find({ chainId, coin }, async function (err, wallets) {
            if (err) {
                console.error('[SUB][MATIC] wallet query error:', err.message || err)
                return
            }

            if (wallets) {
                const wallet = wallets.find(
                    wallet => wallet.address === result.address
                )

                if (wallet) {
                    try {
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
                        console.log('[SUB][MATIC] transaction queued tx:', result.transactionHash, 'wallet:', wallet.address)
                    } catch (queueError) {
                        console.error('[SUB][MATIC] queue add error:', queueError.message || queueError)
                    }
                } else {
                    console.log('[SUB][MATIC] no wallet match for address:', result.address)
                }
            }
        })
    })
})
