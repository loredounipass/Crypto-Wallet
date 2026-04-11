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

connectDB.then(() => {
    const web3 = getWeb3WssInstance(process.env.OPTIMISM_WSS)
    console.log('[SUB][OP] subscription started on chainId:', chainId)

    web3.eth.subscribe('logs', {
        topics: [
            web3.utils.sha3('DepositedOnBlockVault()')
        ]
    }, async function (error, result) {
        if (error) {
            console.error('[SUB][OP] subscription error:', error.message || error)
            return
        }

        console.log('[SUB][OP] log detected tx:', result.transactionHash, 'address:', result.address)
        Wallet.find({ chainId, coin }, async function (err, wallets) {
            if (err) {
                console.error('[SUB][OP] wallet query error:', err.message || err)
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
                        console.log('[SUB][OP] transaction queued tx:', result.transactionHash, 'wallet:', wallet.address)
                    } catch (queueError) {
                        console.error('[SUB][OP] queue add error:', queueError.message || queueError)
                    }
                } else {
                    console.log('[SUB][OP] no wallet match for address:', result.address)
                }
            }
        })
    })
})
