const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const Wallet = require(`${appRoot}/config/models/Wallet`)
const IndexerCheckpoint = require(`${appRoot}/config/models/IndexerCheckpoint`)
const OrderingEngine = require(`${appRoot}/config/utils/OrderingEngine`)

const MAX_BLOCKS_PER_QUERY = 9
const BATCH_DELAY_MS = 250

const CHAIN_CONFIRMATIONS = {
    1: 12,
    137: 150,
    56: 30,
    42161: 20,
    10: 20,
    11155111: 6
}
const DEFAULT_CONFIRMATIONS = 12

const runBackfill = async ({ chainId, tokenAddress, rpcUrl }) => {
    const web3 = new Web3(rpcUrl)
    const topic = Web3.utils.sha3('Transfer(address,address,uint256)')
    const minConf = CHAIN_CONFIRMATIONS[chainId] || DEFAULT_CONFIRMATIONS

    try {
        const latestBlockNumber = Number(await web3.eth.getBlockNumber())
        const targetBlock = latestBlockNumber - minConf

        let checkpoint = await IndexerCheckpoint.findOne({ chainId, tokenAddress })
        if (!checkpoint) {
            checkpoint = new IndexerCheckpoint({ chainId, tokenAddress, last_processed_block: targetBlock - 1000 })
            await checkpoint.save()
        }

        let fromBlock = checkpoint.last_processed_block + 1

        if (fromBlock > targetBlock) {
            return // Up to date
        }

        console.log(`[ERC20-BACKFILL][${chainId}] Starting backfill for ${tokenAddress} from ${fromBlock} to ${targetBlock}`)

        while (fromBlock <= targetBlock) {
            const toBlock = Math.min(fromBlock + MAX_BLOCKS_PER_QUERY - 1, targetBlock)
            
            try {
                const logs = await web3.eth.getPastLogs({
                    fromBlock,
                    toBlock,
                    address: tokenAddress,
                    topics: [topic]
                })

                for (const result of logs) {
                    try {
                        const fromAddress = web3.eth.abi.decodeParameter('address', result.topics[1]).toLowerCase()
                        const toAddress = web3.eth.abi.decodeParameter('address', result.topics[2]).toLowerCase()
                        const value = web3.eth.abi.decodeParameter('uint256', result.data)

                        const wallet = await Wallet.findOne({
                            chainId,
                            address: new RegExp(`^${toAddress}$`, 'i')
                        })

                        if (wallet) {
                            const eventFormatted = {
                                transactionHash: result.transactionHash,
                                logIndex: Number(result.logIndex),
                                blockNumber: Number(result.blockNumber),
                                returnValues: { from: fromAddress, to: toAddress, value }
                            }

                            await OrderingEngine.ingestEvent({
                                chainId,
                                tokenAddress,
                                event: eventFormatted
                            })
                        }
                    } catch (e) {
                        console.error(`[ERC20-BACKFILL][${chainId}] Error processing log in backfill:`, e)
                    }
                }

                // Update checkpoint
                checkpoint.last_processed_block = toBlock
                checkpoint.updated_at = new Date()
                await checkpoint.save()

                fromBlock = toBlock + 1

                await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
            } catch (err) {
                console.error(`[ERC20-BACKFILL][${chainId}] getPastLogs failed:`, err.message || err)
                // On rate limit, wait and retry the same batch
                if (err.message && err.message.includes('exceeded its compute units')) {
                    console.log(`[ERC20-BACKFILL][${chainId}] Rate limited. Waiting 2s before retry...`)
                    await new Promise(r => setTimeout(r, 2000))
                } else {
                    break
                }
            }
        }
    } catch (err) {
        console.error(`[ERC20-BACKFILL][${chainId}] Backfill fatal error:`, err.message || err)
    }
}

module.exports = { runBackfill }
