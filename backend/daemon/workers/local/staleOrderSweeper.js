const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)

const POLL_INTERVAL_MS = 300000 // 5 minutes
const STALE_THRESHOLD_MS = 600000 // 10 minutes

// Colas de BullMQ de las 3 etapas críticas
const escrowFundingQueue = new Queue('escrow-funding')
const escrowReleaseQueue = new Queue('escrow-release')
const escrowCancelQueue = new Queue('escrow-cancel')

// BUSCA ORDENES ATASCADAS EN CUALQUIER ESTADO CRITICO Y LAS REINJECTA A LA COLA CORRESPONDIENTE
const sweepStaleOrders = async () => {
    try {
        const thresholdDate = new Date(Date.now() - STALE_THRESHOLD_MS)
        
        // Buscar órdenes que se quedaron a medias en cualquier proceso
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

        // CAPA DE SEGURIDAD 1: Extraer trabajos vivos de TODAS las colas
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
            // CAPA DE SEGURIDAD 2: Abortar si ya está siendo procesada
            if (activeOrderIds.includes(order.orderId)) {
                console.log(`[STALE-ORDER-SWEEPER] 🛡️ Orden ${order.orderId} omitida: El trabajo sigue vivo en BullMQ.`)
                continue
            }

            // CAPA DE SEGURIDAD 3: Límite de resurrecciones
            const sweepCount = order.sweepRecoveryCount || 0
            if (sweepCount >= 5) {
                console.log(`[STALE-ORDER-SWEEPER] 🛑 Orden ${order.orderId} omitida: Superó el límite de 5 recuperaciones.`)
                continue
            }

            // Seleccionar la cola y trabajo destino basado en el estado atascado
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
            
            // CAPA DE SEGURIDAD 4: ID de Trabajo Único
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
                providerEmail: order.providerEmail
            }, {
                jobId: customJobId,
                attempts: 3,
                backoff: { type: 'exponential', delay: 3000 },
                removeOnComplete: true
            })
            
            // Actualizar gracia
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

connectDB.then(() => {
    console.log('[STALE-ORDER-SWEEPER] Connected to MongoDB')
    console.log('[STALE-ORDER-SWEEPER] Omni-Sweeper started, polling every', POLL_INTERVAL_MS, 'ms')
    sweepStaleOrders()
    setInterval(sweepStaleOrders, POLL_INTERVAL_MS)
}).catch(err => {
    console.error('[STALE-ORDER-SWEEPER] Database connection failed:', err)
})
