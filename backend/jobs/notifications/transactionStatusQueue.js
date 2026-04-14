const appRoot = require('app-root-path')
const { Queue } = require(`${appRoot}/config/bullmq`)

const statusQueue = new Queue('transaction-status-events')

const publishTransactionStatusUpdate = async (payload) => {
    if (!payload || !payload.transactionId) return

    try {
        await statusQueue.add('status-update', payload, {
            removeOnComplete: true,
            removeOnFail: 50,
            attempts: 1
        })
    } catch (error) {
        console.error('[STATUS_QUEUE] failed to enqueue status update', error?.message || error)
    }
}

module.exports = {
    publishTransactionStatusUpdate
}
