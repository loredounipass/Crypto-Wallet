const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const { Queue } = require(`${appRoot}/config/bullmq`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { generateEventId } = require(`${appRoot}/config/utils/eventIdGenerator`)


// WEBSOCKET RECONNECTION BACKOFF CONFIGURATION IN MILLISECONDS
const RECONNECT_BASE_DELAY_MS = 5000
const RECONNECT_MAX_DELAY_MS = 60000


// CONNECTS TO WEBSOCKET PROVIDER AND SUBSCRIBES TO REAL-TIME ERC20 TRANSFER LOGS
const connectAndSubscribeRealtime = async ({ chainId, tokenAddress, wssUrl }) => {
    const topic = Web3.utils.sha3('Transfer(address,address,uint256)')
    let retryDelay = RECONNECT_BASE_DELAY_MS
    let web3

    const subscribe = async () => {
        // STEP 1: INITIALIZE WEBSOCKET PROVIDER AND ATTACH LIFECYCLE EVENT HANDLERS
        web3 = new Web3(wssUrl)
        console.log(`[ERC20-REALTIME][${chainId}] subscription started for token:`, tokenAddress)

        if (web3.currentProvider && typeof web3.currentProvider.on === 'function') {
            web3.currentProvider.on('error', (e) => {
                console.error(`[ERC20-REALTIME][${chainId}] Web3 provider error:`, e.message || e)
            })
            web3.currentProvider.on('end', () => {
                console.error(`[ERC20-REALTIME][${chainId}] WebSocket connection ended, reconnecting in ${retryDelay}ms...`)
                web3.currentProvider.removeAllListeners()
                scheduleReconnect()
            })
        }

        // STEP 2: SUBSCRIBE TO ON-CHAIN ERC20 TRANSFER LOGS FOR TARGET TOKEN
        let subscription
        try {
            subscription = await web3.eth.subscribe('logs', {
                address: tokenAddress,
                topics: [topic]
            })
        } catch (err) {
            console.error(`[ERC20-REALTIME][${chainId}] subscribe failed:`, err.message || err)
            scheduleReconnect()
            return
        }

        retryDelay = RECONNECT_BASE_DELAY_MS

        subscription.on('data', async (result) => {
            try {
                // STEP 3: DECODE RAW EVENT PARAMETERS AND VALIDATE RECIPIENT WALLET
                const fromAddress = web3.eth.abi.decodeParameter('address', result.topics[1]).toLowerCase()
                const toAddress = web3.eth.abi.decodeParameter('address', result.topics[2]).toLowerCase()
                const value = web3.eth.abi.decodeParameter('uint256', result.data)

                const wallet = await Wallet.findOne({
                    chainId,
                    address: new RegExp(`^${toAddress}$`, 'i')
                })

                if (!wallet) {
                    return
                }

                // STEP 4: GENERATE DETERMINISTIC EVENT ID AND ENQUEUE TRANSFER JOB IN BULLMQ
                const eventId = generateEventId(chainId, result.transactionHash, Number(result.logIndex), tokenAddress)
                const processingQueue = new Queue('erc20-processing')
                await processingQueue.add('process-transfer', {
                    eventId,
                    chainId,
                    txHash: result.transactionHash,
                    logIndex: Number(result.logIndex),
                    blockNumber: Number(result.blockNumber),
                    tokenAddress,
                    walletAddress: toAddress.toLowerCase(),
                    amount: value.toString()
                }, {
                    jobId: eventId,
                    priority: 2097151 - (Number(result.blockNumber) % 2097152),
                    attempts: 5,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: { age: 86400, count: 1000 },
                    removeOnFail: 100
                })

            } catch (error) {
                console.error(`[ERC20-REALTIME][${chainId}] data handler error:`, error.message || error)
            }
        })

        subscription.on('error', (error) => {
            console.error(`[ERC20-REALTIME][${chainId}] subscription error:`, error.message || error)
        })
    }

    const scheduleReconnect = () => {
        // STEP 5: SCHEDULE EXPONENTIAL BACKOFF RECONNECTION ATTEMPT
        setTimeout(async () => {
            console.log(`[ERC20-REALTIME][${chainId}] attempting reconnection...`)
            try {
                await subscribe()
                retryDelay = RECONNECT_BASE_DELAY_MS
            } catch (err) {
                console.error(`[ERC20-REALTIME][${chainId}] reconnection failed:`, err.message || err)
                retryDelay = Math.min(retryDelay * 2, RECONNECT_MAX_DELAY_MS)
                scheduleReconnect()
            }
        }, retryDelay)
    }

    await subscribe()
}


// EXPORTS REALTIME ERC20 SUBSCRIPTION HANDLER FOR DAEMON WORKERS
module.exports = { connectAndSubscribeRealtime }
