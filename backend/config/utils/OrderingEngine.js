const appRoot = require('app-root-path')
const { Queue } = require(`${appRoot}/config/bullmq`)
const { generateEventId } = require('./eventIdGenerator')

const processingQueue = new Queue('erc20-processing')

class OrderingEngine {
    static async ingestEvent({ chainId, tokenAddress, event }) {
        const { transactionHash, logIndex, blockNumber, returnValues } = event
        const from = returnValues.from || returnValues['0']
        const to = returnValues.to || returnValues['1']
        const value = returnValues.value || returnValues['2']

        const eventId = generateEventId(chainId, transactionHash, logIndex, tokenAddress)

        await processingQueue.add('process-transfer', {
            eventId,
            chainId,
            txHash: transactionHash,
            logIndex,
            blockNumber,
            tokenAddress,
            walletAddress: to.toLowerCase(),
            amount: value.toString()
        }, {
            priority: 2097151 - (Number(blockNumber) % 2097152),
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: 100
        })

        console.log(`[ORDERING] Event ${eventId} ingested and queued. Block: ${blockNumber}`)
        return eventId
    }
}

module.exports = OrderingEngine
