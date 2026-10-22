const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const sendWithdraw = require(`${appRoot}/jobs/withdraws/transaction`)
const { Worker } = require(`${appRoot}/config/bullmq`)


// INITIALIZES DATABASE CONNECTION AND REGISTERS CONCURRENT WITHDRAWAL REQUESTS BULLMQ WORKER
connectDB.then(() => {
    console.log('[WITHDRAW-REQUESTS] Worker started and ready')
    new Worker('withdraw-requests', async (job) => {
        // STEP 1: DISPATCH ASYNCHRONOUS WITHDRAWAL TRANSACTION AND RETURN BROADCAST RESULT
        console.log(`[WITHDRAW-REQUESTS] Processing job ${job.id}`)
        try {
            const result = await sendWithdraw(job.data)
            console.log(`[WITHDRAW-REQUESTS] Job ${job.id} completed with result: ${result}`)
            return result
        } catch (error) {
            console.error(`[WITHDRAW-REQUESTS] Job ${job.id} failed:`, error.message || error)
            throw error
        }
    }, { concurrency: 15 })

    // FINAL FAILURE HANDLER: EXECUTES SAFE ROLLBACK AND REFUNDS BALANCE WHEN ATTEMPTS ARE EXHAUSTED
    .on('failed', async (job, err) => {
        // STEP 1: VERIFY IF JOB HAS EXHAUSTED ALL RETRY ATTEMPTS BEFORE INITIATING ROLLBACK
        if (!job) return
        const maxAttempts = job.opts?.attempts || 0
        if (maxAttempts > 0 && job.attemptsMade < maxAttempts) return

        try {
            const { transactionId, walletId, amount, withdrawAddress } = job.data
            if (!transactionId) return

            const Transaction = require(`${appRoot}/config/models/Transaction`)
            const Wallet = require(`${appRoot}/config/models/Wallet`)
            const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)

            // STEP 2: AUDIT TRANSACTION DOCUMENT TO ENSURE IT WAS NOT CONFIRMED CONCURRENTLY
            const txRecord = await Transaction.findOne({ _id: transactionId })
            if (txRecord && (txRecord.status === 3 || txRecord.status === 2)) {
                console.log(`[WITHDRAW-REQUESTS] Tx ${transactionId} already confirmed (status=${txRecord.status}). No rollback.`)
                return
            }

            // STEP 3: ATOMICALLY UPDATE STATUS TO BROADCAST FAILED (STATUS 5) AND RE-CREDIT WALLET BALANCE
            await Transaction.updateOne(
                { _id: transactionId },
                { $set: { status: 5 } }
            )

            await Wallet.updateOne(
                { _id: walletId },
                { $inc: { balance: amount } }
            )

            // STEP 4: PUBLISH STATUS UPDATE EVENT FOR REAL-TIME CLIENT NOTIFICATION
            await publishTransactionStatusUpdate({
                transactionId,
                status: 5,
                confirmations: 0,
                nature: 2,
                amount: -1 * amount,
                coin: txRecord?.coin || 'UNKNOWN',
                chainId: txRecord?.chainId,
                to: withdrawAddress,
                fee: 0,
                source: 'withdraw-requests-final-failure'
            })

            console.error(`[WITHDRAW-REQUESTS] FINAL FAILURE for tx ${transactionId}: ` +
                `${err.message}. Status→5, balance restored (+${amount}).`)
        } catch (rollbackErr) {
            console.error('[WITHDRAW-REQUESTS] Rollback error:', rollbackErr.message)
        }
    })
})