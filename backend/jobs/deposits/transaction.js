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
        const normalizedHash = String(transactionHash).toLowerCase()
        // IDEMPOTENCIA POR txHash: txHash no tiene indice unico, asi que el catch
        // 11000 nunca dispara. Verificar existencia antes de insertar evita el
        // duplicado con docs creados por workers P2P (escrow release/refund) que
        // usan el mismo hash. Si existe, reutilizar y no crear segundo doc.
        const preExisting = await Transaction.findOne({ txHash: normalizedHash })
        if (preExisting) {
            console.log('[DEPOSIT_TX] Transaction already exists (pre-check by txHash), reusing:', {
                transactionHash: normalizedHash,
                transactionId: preExisting._id.toString()
            })
            await Wallet.updateOne({
                address: walletAddress,
                chainId,
                coin: coin.toUpperCase()
            }, {
                $addToSet: { transactions: preExisting._id }
            }).catch(e => console.error('[DEPOSIT_TX] Failed to add existing tx ref:', e.message))
            const depositsQueue = new Queue(`${coin.toLowerCase()}-deposits`)
            await depositsQueue.add('deposit', {
                walletAddress,
                transactionHash: preExisting.txHash,
                chainId,
                coin,
                transactionId: preExisting._id.toString(),
                uuid: uuidv4()
            }, {
                jobId: `dep-${preExisting.txHash}`,
                attempts: 20,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: { age: 86400, count: 1000 },
                removeOnFail: 50
            })
            return 'deposit_tx_exists'
        }
        let transaction
        try {
            transaction = await new Transaction({
                nature: 1,
                amount: typeof amount === 'number' ? amount : undefined,
                created_at: Date.now(),
                txHash: normalizedHash
            }).save()
        } catch (err) {
            if (err.code === 11000) {
                console.log('[DEPOSIT_TX] Transaction already exists (duplicate txHash), enqueuing deposit job anyway for existing tx:', {
                    transactionHash
                })
                const existing = await Transaction.findOne({ txHash: String(transactionHash).toLowerCase() })
                if (existing) {
                    await Wallet.updateOne({
                        address: walletAddress,
                        chainId,
                        coin: coin.toUpperCase()
                    }, {
                        $addToSet: { transactions: existing._id }
                    }).catch(e => console.error('[DEPOSIT_TX] Failed to add existing tx ref:', e.message))
                    
                    const depositsQueue = new Queue(`${coin.toLowerCase()}-deposits`)
                    depositsQueue.add('deposit', {
                        walletAddress,
                        transactionHash: existing.txHash,
                        chainId,
                        coin,
                        transactionId: existing._id.toString(),
                        uuid: uuidv4()
                    }, {
                        jobId: `dep-${existing.txHash}`,
                        attempts: 20,
                        backoff: {
                            type: 'exponential',
                            delay: 5000,
                        },
                        removeOnComplete: { age: 86400, count: 1000 },
                        removeOnFail: 50
                    })
                    console.log('[DEPOSIT_TX] deposit job enqueued for existing tx', {
                        queue: `${coin.toLowerCase()}-deposits`,
                        transactionId: existing._id.toString(),
                        transactionHash: existing.txHash
                    })
                }
                return 'deposit_tx_exists'
            }
            throw err
        }

        await publishTransactionStatusUpdate({
            transactionId: transaction._id.toString(),
            status: transaction.status || 1,
            confirmations: transaction.confirmations || 0,
            nature: 1,
            coin,
            chainId,
            amount: typeof amount === 'number' ? amount : undefined,
            txHash: String(transactionHash).toLowerCase(),
            to: walletAddress,
            fee: 0
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
            await depositsQueue.add('deposit', {
                walletAddress,
                transactionHash: normalizedHash,
                chainId,
                coin,
                transactionId: transaction._id.toString(),
                uuid: uuidv4()
            }, {
                jobId: `dep-${normalizedHash}`,
                attempts: 20,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: { age: 86400, count: 1000 },
                removeOnFail: 50
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
