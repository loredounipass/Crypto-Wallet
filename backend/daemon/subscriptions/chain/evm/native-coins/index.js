const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const { Queue } = require(`${appRoot}/config/bullmq`)
const { Web3 } = require('web3')
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { v4: uuidv4 } = require('uuid')

const connectDB = require(`${appRoot}/config/db/getMongoose`)

const RECONNECT_BASE_DELAY_MS = 5000
const RECONNECT_MAX_DELAY_MS = 60000

const getWeb3WssInstance = (wss) => {
    console.log('getWeb3WssInstance called with wss:', wss);
    const web3 = new Web3(wss);
    return web3;
}

const connectAndSubscribe = async ({ chainId, coin, wssUrl, queueName }) => {
    const transactionsQueue = new Queue(queueName)
    const topic = Web3.utils.sha3('DepositedOnMetaDapp()')
    let retryDelay = RECONNECT_BASE_DELAY_MS
    let web3

    const subscribe = async () => {
        web3 = getWeb3WssInstance(wssUrl)
        console.log(`[SUB][${coin}] subscription started on chainId:`, chainId)
        console.log(`[SUB][${coin}] listening topic:`, topic)

        if (web3.currentProvider && typeof web3.currentProvider.on === 'function') {
            web3.currentProvider.on('error', (e) => {
                console.error(`[SUB][${coin}] Web3 provider error:`, e.message || e)
            })
            web3.currentProvider.on('end', () => {
                console.error(`[SUB][${coin}] WebSocket connection ended, reconnecting in ${retryDelay}ms...`)
                web3.currentProvider.removeAllListeners()
                scheduleReconnect()
            })
        }

        let subscription
        try {
            subscription = await web3.eth.subscribe('logs', { topics: [topic] })
        } catch (err) {
            console.error(`[SUB][${coin}] subscribe failed:`, err.message || err)
            scheduleReconnect()
            return
        }

        retryDelay = RECONNECT_BASE_DELAY_MS

        subscription.on('data', async (result) => {
            try {
                const eventAddress = (result.address || '').toLowerCase()
                console.log(`[SUB][${coin}] log detected tx:`, result.transactionHash, 'address:', result.address)

                const wallet = await Wallet.findOne({
                    chainId,
                    coin,
                    address: new RegExp(`^${eventAddress}$`, 'i')
                })

                if (!wallet) {
                    console.log(`[SUB][${coin}] no wallet match for address:`, result.address)
                    return
                }

                await transactionsQueue.add('transaction', {
                    walletAddress: wallet.address,
                    transactionHash: result.transactionHash,
                    chainId,
                    coin,
                    uuid: uuidv4()
                }, {
                    jobId: `${result.transactionHash}-${result.logIndex}`,
                    attempts: 2,
                    backoff: {
                        type: 'exponential',
                        delay: 5000
                    },
                    removeOnComplete: true,
                    removeOnFail: 50
                })
                console.log(`[SUB][${coin}] transaction queued tx:`, result.transactionHash, 'wallet:', wallet.address)
            } catch (error) {
                console.error(`[SUB][${coin}] data handler error:`, error.message || error)
            }
        })

        subscription.on('error', (error) => {
            console.error(`[SUB][${coin}] subscription error:`, error.message || error)
        })
    }

    const scheduleReconnect = () => {
        setTimeout(async () => {
            console.log(`[SUB][${coin}] attempting reconnection...`)
            try {
                await subscribe()
                retryDelay = RECONNECT_BASE_DELAY_MS
            } catch (err) {
                console.error(`[SUB][${coin}] reconnection failed:`, err.message || err)
                retryDelay = Math.min(retryDelay * 2, RECONNECT_MAX_DELAY_MS)
                scheduleReconnect()
            }
        }, retryDelay)
    }

    await subscribe()
}

module.exports = {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance,
    connectAndSubscribe
}
