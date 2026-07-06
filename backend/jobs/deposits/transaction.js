const appRoot = require('app-root-path')
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const { v4: uuidv4 } = require('uuid')
const { publishTransactionStatusUpdate } = require('../notifications/transactionStatusQueue')


const createTransaction
    = async ({ walletAddress, transactionHash, chainId, coin, amount }) => {
        console.log('[DEPOSIT_TX] create transaction requested', {
            walletAddress,
            transactionHash,
            chainId,
            coin,
            amount
        })
        let transaction
        try {
            transaction = await new Transaction({
                nature: 1,
                amount: typeof amount === 'number' ? amount : undefined,
                created_at: Date.now(),
                txHash: transactionHash
            }).save()
        } catch (err) {
            if (err.code === 11000) {
                console.log('[DEPOSIT_TX] Transaction already exists (duplicate txHash), skipping enqueue:', {
                    transactionHash
                })
                const existing = await Transaction.findOne({ txHash: transactionHash })
                if (existing) {
                    await Wallet.updateOne({
                        address: walletAddress,
                        chainId,
                        coin: coin.toUpperCase()
                    }, {
                        $addToSet: { transactions: existing._id }
                    }).catch(e => console.error('[DEPOSIT_TX] Failed to add existing tx ref:', e.message))
                }
                return 'deposit_tx_exists'
            }
            throw err
        }

        await publishTransactionStatusUpdate({
            transactionId: transaction._id.toString(),
            status: transaction.status || 1,
            confirmations: transaction.confirmations || 0
        })

        const result = await Wallet.updateOne({
            address: walletAddress,
            chainId,
            coin: coin.toUpperCase()
        }, {
            $addToSet: {
                transactions: transaction._id
            }
        })

        if (result) {
            const depositsQueue = new Queue(`${coin.toLowerCase()}-deposits`)
            depositsQueue.add('deposit', {
                walletAddress,
                transactionHash,
                chainId,
                coin,
                transactionId: transaction._id.toString(),
                uuid: uuidv4()
            }, {
                attempts: 20,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                }
            })
            console.log('[DEPOSIT_TX] deposit job enqueued', {
                queue: `${coin.toLowerCase()}-deposits`,
                transactionId: transaction._id.toString(),
                transactionHash
            })
        }

        return 'deposit'
    }

module.exports = createTransaction
