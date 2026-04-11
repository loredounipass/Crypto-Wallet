const {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
} = require('./index')

const chainId = 4002
const coin = 'FTM'

const transactionsQueue = new Queue('ftm-transactions')

connectDB.then(() => {
    const web3 = getWeb3WssInstance(process.env.FANTOM_WSS)
    console.log('[SUB][FTM] subscription started on chainId:', chainId)

    web3.eth.subscribe('logs', {
        topics: [
            web3.utils.sha3('DepositedOnMetaDapp()')
        ]
    }, async function (error, result) {
        if (error) {
            console.error('[SUB][FTM] subscription error:', error.message || error)
            return
        }

        console.log('[SUB][FTM] log detected tx:', result.transactionHash, 'address:', result.address)
        Wallet.find({ chainId, coin }, async function (err, wallets) {
            if (err) {
                console.error('[SUB][FTM] wallet query error:', err.message || err)
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
                        console.log('[SUB][FTM] transaction queued tx:', result.transactionHash, 'wallet:', wallet.address)
                    } catch (queueError) {
                        console.error('[SUB][FTM] queue add error:', queueError.message || queueError)
                    }
                } else {
                    console.log('[SUB][FTM] no wallet match for address:', result.address)
                }
            }
        })
    })
})
