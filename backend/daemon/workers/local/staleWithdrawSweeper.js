const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)


// POLLING INTERVAL (10 MINUTES) AND STALE WITHDRAWAL THRESHOLD (1 HOUR)
const POLL_INTERVAL_MS = 600000
const STALE_THRESHOLD_MS = 3600000


// BULLMQ QUEUE INSTANCE FOR WITHDRAW REQUEST MONITORING
const withdrawQueue = new Queue('withdraw-requests')


// IDENTIFIES WITHDRAWALS STUCK IN BROADCASTING STATE, FAILS THEM, AND REFUNDS USER BALANCE
const sweepStaleWithdraws = async () => {
    try {
        const thresholdDate = new Date(Date.now() - STALE_THRESHOLD_MS)

        // STEP 1: QUERY FOR STALE WITHDRAWAL TRANSACTIONS STUCK IN BROADCASTING STATUS (STATUS 1)
        const staleTxs = await Transaction.find({
            nature: 2,
            status: 1,
            created_at: { $lt: thresholdDate }
        }).limit(50)

        if (staleTxs.length === 0) return

        // STEP 2: AUDIT ACTIVE WITHDRAWAL BULLMQ JOBS TO PREVENT RACE CONDITIONS
        const activeJobs = await withdrawQueue.getJobs(['waiting', 'active', 'delayed'])
        const activeTransactionIds = activeJobs
            .map(j => j.data?.transactionId)
            .filter(Boolean)

        console.log(`[STALE-WITHDRAW-SWEEPER] Found ${staleTxs.length} stale withdrawals. Checking...`)

        for (const tx of staleTxs) {
            const txId = tx._id.toString()

            // STEP 3: SKIP TRANSACTIONS WITH ACTIVE BACKGROUND PROCESSING JOBS
            if (activeTransactionIds.includes(txId)) {
                console.log(`[STALE-WITHDRAW-SWEEPER] Skipping ${txId}: active job exists`)
                continue
            }

            // STEP 4: LOCATE ASSOCIATED USER WALLET AND CALCULATE REFUND AMOUNT
            const wallet = await Wallet.findOne({ transactions: tx._id })
            if (!wallet) {
                console.error(`[STALE-WITHDRAW-SWEEPER] No wallet found for tx ${txId}`)
                continue
            }

            const amount = Math.abs(tx.amount)

            // STEP 5: ATOMICALLY MARK TRANSACTION AS FAILED (STATUS 5) AND CREDIT WALLET BALANCE
            await Transaction.updateOne(
                { _id: tx._id },
                { $set: { status: 5 } }
            )

            await Wallet.updateOne(
                { _id: wallet._id },
                { $inc: { balance: amount } }
            )

            // STEP 6: PUBLISH TRANSACTION STATUS UPDATE NOTIFICATION FOR REAL-TIME UI REFLECTION
            await publishTransactionStatusUpdate({
                transactionId: txId,
                status: 5,
                confirmations: 0,
                nature: 2,
                amount: tx.amount,
                coin: wallet.coin,
                chainId: wallet.chainId,
                to: tx.to,
                fee: 0,
                source: 'stale-withdraw-sweeper'
            })

            console.warn(`[STALE-WITHDRAW-SWEEPER] Recovered stale withdrawal ${txId}. ` +
                `Status→5, balance restored (+${amount} to wallet ${wallet._id})`)
        }
    } catch (error) {
        console.error('[STALE-WITHDRAW-SWEEPER] Error:', error.message || error)
    }
}


// INITIALIZES DATABASE CONNECTION AND STARTS RECURRING STALE WITHDRAWAL MONITOR POLLER
connectDB.then(() => {
    console.log('[STALE-WITHDRAW-SWEEPER] Connected to MongoDB')
    console.log('[STALE-WITHDRAW-SWEEPER] Polling every', POLL_INTERVAL_MS, 'ms')
    sweepStaleWithdraws()
    setInterval(sweepStaleWithdraws, POLL_INTERVAL_MS)
}).catch(err => {
    console.error('[STALE-WITHDRAW-SWEEPER] DB connection failed:', err)
})
