const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)

const POLL_INTERVAL_MS = 600000  // 10 minutos
const STALE_THRESHOLD_MS = 3600000  // 1 hora: si lleva más de 1h en status 1, está muerta

const withdrawQueue = new Queue('withdraw-requests')


// BUSCA TRANSACCIONES DE RETIRO ATASCADAS EN STATUS 1 POR MAS DE 1 HORA Y LAS MARCA COMO FALLIDAS RESTAURANDO EL BALANCE
const sweepStaleWithdraws = async () => {
    try {
        const thresholdDate = new Date(Date.now() - STALE_THRESHOLD_MS)

        // Buscar transacciones de retiro atascadas en status 1 (Broadcasting) por más de 1 hora
        const staleTxs = await Transaction.find({
            nature: 2,               // Withdrawal
            status: 1,               // Broadcasting (stuck)
            created_at: { $lt: thresholdDate }
        }).limit(50)

        if (staleTxs.length === 0) return

        // Verificar jobs activos en BullMQ para no duplicar
        const activeJobs = await withdrawQueue.getJobs(['waiting', 'active', 'delayed'])
        const activeTransactionIds = activeJobs
            .map(j => j.data?.transactionId)
            .filter(Boolean)

        console.log(`[STALE-WITHDRAW-SWEEPER] Found ${staleTxs.length} stale withdrawals. Checking...`)

        for (const tx of staleTxs) {
            const txId = tx._id.toString()

            // No tocar si BullMQ ya lo está procesando
            if (activeTransactionIds.includes(txId)) {
                console.log(`[STALE-WITHDRAW-SWEEPER] Skipping ${txId}: active job exists`)
                continue
            }

            // Marcar como Broadcast Failed y restaurar balance
            const wallet = await Wallet.findOne({ transactions: tx._id })
            if (!wallet) {
                console.error(`[STALE-WITHDRAW-SWEEPER] No wallet found for tx ${txId}`)
                continue
            }

            const amount = Math.abs(tx.amount)

            await Transaction.updateOne(
                { _id: tx._id },
                { $set: { status: 5 } }  // 5 = Broadcast Failed
            )

            await Wallet.updateOne(
                { _id: wallet._id },
                { $inc: { balance: amount } }
            )

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

connectDB.then(() => {
    console.log('[STALE-WITHDRAW-SWEEPER] Connected to MongoDB')
    console.log('[STALE-WITHDRAW-SWEEPER] Polling every', POLL_INTERVAL_MS, 'ms')
    sweepStaleWithdraws()
    setInterval(sweepStaleWithdraws, POLL_INTERVAL_MS)
}).catch(err => {
    console.error('[STALE-WITHDRAW-SWEEPER] DB connection failed:', err)
})
