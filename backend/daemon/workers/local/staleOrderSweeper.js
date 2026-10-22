const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)

// POLLING INTERVAL (5 MINUTES) AND STALE ORDER THRESHOLD (10 MINUTES)
const POLL_INTERVAL_MS = 300000
const STALE_THRESHOLD_MS = 600000


// BULLMQ QUEUE INSTANCES FOR THE THREE CRITICAL ESCROW LIFECYCLE STAGES
const escrowFundingQueue = new Queue('escrow-funding')
const escrowReleaseQueue = new Queue('escrow-release')
const escrowCancelQueue = new Queue('escrow-cancel')


// IDENTIFIES UNPROCESSED STALE ESCROW ORDERS AND RE-ENQUEUES THEM TO APPROPRIATE WORKERS
const sweepStaleOrders = async () => {
    try {
        const thresholdDate = new Date(Date.now() - STALE_THRESHOLD_MS)
        
        // STEP 1: QUERY FOR STALE ORDERS MISSING CRITICAL ON-CHAIN OR LEDGER TRANSACTION HASHES
        const staleOrders = await EscrowOrder.find({
            createdAt: { $lt: thresholdDate },
            $or: [
                { status: 'pending', escrowTxHash: { $exists: false } },
                { status: 'released', releaseTxHash: { $exists: false } },
                { status: 'cancelled', refundTxHash: { $exists: false } }
            ]
        })

        if (staleOrders.length === 0) {
            return
        }

        // STEP 2: AUDIT ACTIVE JOBS ACROSS ALL QUEUES TO PREVENT CONCURRENT RECOVERY CONFLICTS
        const fundingJobs = await escrowFundingQueue.getJobs(['waiting', 'active', 'delayed', 'paused'])
        const releaseJobs = await escrowReleaseQueue.getJobs(['waiting', 'active', 'delayed', 'paused'])
        const cancelJobs = await escrowCancelQueue.getJobs(['waiting', 'active', 'delayed', 'paused'])
        
        const activeOrderIds = [
            ...fundingJobs.map(j => j.data?.orderId),
            ...releaseJobs.map(j => j.data?.orderId),
            ...cancelJobs.map(j => j.data?.orderId)
        ].filter(Boolean)

        console.log(`[STALE-ORDER-SWEEPER] Detectadas ${staleOrders.length} órdenes atascadas (Omni-Sweep). Iniciando recuperación...`)

        for (const order of staleOrders) {
            // STEP 3: FILTER OUT ACTIVELY RUNNING JOBS AND ORDERS EXCEEDING MAX RECOVERY ATTEMPTS
            if (activeOrderIds.includes(order.orderId)) {
                console.log(`[STALE-ORDER-SWEEPER] 🛡️ Orden ${order.orderId} omitida: El trabajo sigue vivo en BullMQ.`)
                continue
            }

            const sweepCount = order.sweepRecoveryCount || 0
            if (sweepCount >= 5) {
                console.log(`[STALE-ORDER-SWEEPER] 🛑 Orden ${order.orderId} omitida: Superó el límite de 5 recuperaciones.`)
                continue
            }

            // STEP 4: RESOLVE TARGET WORKER QUEUE AND JOB DISPATCH TYPE BASED ON ORDER STATE
            let targetQueue = null
            let jobName = ''
            
            if (order.status === 'pending') {
                targetQueue = escrowFundingQueue
                jobName = 'fund'
            } else if (order.status === 'released') {
                targetQueue = escrowReleaseQueue
                jobName = 'release'
            } else if (order.status === 'cancelled') {
                targetQueue = escrowCancelQueue
                jobName = 'cancel'
            }

            if (!targetQueue) continue

            console.log(`[STALE-ORDER-SWEEPER] Reactivando orden ${order.orderId} en cola '${jobName}' (Intento #${sweepCount + 1})...`)
            
            // STEP 5: ENQUEUE RECOVERY JOB WITH UNIQUE DEDUPLICATED IDENTIFIER AND EXPONENTIAL BACKOFF
            const customJobId = `sweep-${order.orderId}-${jobName}-${Date.now()}`

            await targetQueue.add(jobName, {
                orderId: order.orderId,
                sellerWalletAddress: order.sellerWalletAddress,
                providerWalletAddress: order.providerWalletAddress,
                amount: order.amount,
                coin: order.coin,
                chainId: order.chainId,
                gasFee: order.gasFee,
                sellerEmail: order.sellerEmail,
                providerEmail: order.providerEmail,
                isToken: order.isToken,
                tokenAddress: order.tokenAddress
            }, {
                jobId: customJobId,
                attempts: 3,
                backoff: { type: 'exponential', delay: 3000 },
                removeOnComplete: true
            })
            
            // STEP 6: ATOMICALLY INCREMENT RECOVERY COUNTER AND REFRESH TIMESTAMP GRACE PERIOD
            await EscrowOrder.updateOne(
                { _id: order._id }, 
                { 
                    $set: { createdAt: new Date() },
                    $inc: { sweepRecoveryCount: 1 } 
                }
            )
        }
    } catch (error) {
        console.error('[STALE-ORDER-SWEEPER] Error en la limpieza Omni-Sweep:', error.message || error)
    }
}


// INITIALIZES DATABASE CONNECTION AND STARTS RECURRING STALE ORDER SWEEPER POLLER
connectDB.then(() => {
    console.log('[STALE-ORDER-SWEEPER] Connected to MongoDB')
    console.log('[STALE-ORDER-SWEEPER] Omni-Sweeper started, polling every', POLL_INTERVAL_MS, 'ms')
    sweepStaleOrders()
    setInterval(sweepStaleOrders, POLL_INTERVAL_MS)
}).catch(err => {
    console.error('[STALE-ORDER-SWEEPER] Database connection failed:', err)
})
