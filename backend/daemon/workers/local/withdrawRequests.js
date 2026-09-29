const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const sendWithdraw = require(`${appRoot}/jobs/withdraws/transaction`)
const { Worker } = require(`${appRoot}/config/bullmq`)

connectDB.then(() => {
    console.log('[WITHDRAW-REQUESTS] Worker started and ready')
    new Worker('withdraw-requests', async (job) => {
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

    // Handler de fallo final: cuando el job agota TODOS sus reintentos,
    // marcar la transacción como fallida y restaurar el balance del usuario
    .on('failed', async (job, err) => {
        if (!job) return
        const maxAttempts = job.opts?.attempts || 0
        if (maxAttempts > 0 && job.attemptsMade < maxAttempts) return

        // ÚLTIMO intento fallido → rollback seguro
        try {
            const { transactionId, walletId, amount, withdrawAddress } = job.data
            if (!transactionId) return

            const Transaction = require(`${appRoot}/config/models/Transaction`)
            const Wallet = require(`${appRoot}/config/models/Wallet`)
            const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)

            // Verificar que la tx no fue confirmada mientras tanto
            const txRecord = await Transaction.findOne({ _id: transactionId })
            if (txRecord && (txRecord.status === 3 || txRecord.status === 2)) {
                console.log(`[WITHDRAW-REQUESTS] Tx ${transactionId} already confirmed (status=${txRecord.status}). No rollback.`)
                return
            }

            await Transaction.updateOne(
                { _id: transactionId },
                { $set: { status: 5 } }  // 5 = Broadcast Failed
            )

            await Wallet.updateOne(
                { _id: walletId },
                { $inc: { balance: amount } }  // Restaurar balance
            )

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