const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const { Queue } = require(`${appRoot}/config/bullmq`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { generateEventId } = require(`${appRoot}/config/utils/eventIdGenerator`)

const RECONNECT_BASE_DELAY_MS = 5000
const RECONNECT_MAX_DELAY_MS = 60000

const connectAndSubscribeRealtime = async ({ chainId, tokenAddress, wssUrl }) => {
    const topic = Web3.utils.sha3('Transfer(address,address,uint256)')
    let retryDelay = RECONNECT_BASE_DELAY_MS
    let web3

    const subscribe = async () => {
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
                // Return values are not automatically decoded in low-level subscribe('logs') without ABI.
                // We decode the topics and data manually for Transfer event.
                const fromAddress = web3.eth.abi.decodeParameter('address', result.topics[1]).toLowerCase()
                const toAddress = web3.eth.abi.decodeParameter('address', result.topics[2]).toLowerCase()
                const value = web3.eth.abi.decodeParameter('uint256', result.data)

                // Filter: check if `toAddress` exists in our Wallet collection
                const wallet = await Wallet.findOne({
                    chainId,
                    address: toAddress.toLowerCase()
                })

                if (!wallet) {
                    return // Not a deposit to our users
                }

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
                    removeOnComplete: true,
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

module.exports = { connectAndSubscribeRealtime }
