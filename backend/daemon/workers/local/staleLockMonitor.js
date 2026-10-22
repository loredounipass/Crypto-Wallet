const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)

const EscrowOrder = require(`${appRoot}/config/models/EscrowOrder`)
const Erc20ForwardExecution = require(`${appRoot}/config/models/Erc20ForwardExecution`)
const RelayerLock = require(`${appRoot}/config/models/RelayerLock`)


// POLLING INTERVAL AND STALE THRESHOLD IN MILLISECONDS (5 MINUTES TIMEOUT)
const POLL_INTERVAL_MS = 60000
const STALE_THRESHOLD_MS = 300000


// PERIODICALLY SCANS DATABASE AND ATOMICALLY RELEASES ORPHANED EXECUTION AND EXPIRY LOCKS
const checkStaleLocks = async () => {
    try {
        const thresholdDate = new Date(Date.now() - STALE_THRESHOLD_MS)

        // STEP 1: RELEASE ORPHANED ESCROW ORDER EXPIRY LOCKS (EXPIRYLOCKEDAT)
        const escrowResult = await EscrowOrder.updateMany(
            { 
                status: { $in: ['pending', 'funded'] }, 
                expiryLockedAt: { $lt: thresholdDate } 
            },
            { $set: { expiryLockedAt: null } }
        )
        if (escrowResult.modifiedCount > 0) {
            console.log(`[STALE-LOCK-MONITOR] Liberados ${escrowResult.modifiedCount} locks huérfanos de EscrowOrder (expiryLockedAt)`)
        }

        // STEP 2: RELEASE ORPHANED ERC20 FORWARD EXECUTION LOCKS (FORWARDLOCK)
        const forwardResult = await Erc20ForwardExecution.updateMany(
            { 
                forwardLock: true, 
                forwardLockedAt: { $lt: thresholdDate } 
            },
            { $unset: { forwardLock: '', forwardLockedAt: '' } }
        )
        if (forwardResult.modifiedCount > 0) {
            console.log(`[STALE-LOCK-MONITOR] Liberados ${forwardResult.modifiedCount} locks huérfanos de Erc20ForwardExecution (forwardLock)`)
        }

        // STEP 3: RELEASE ORPHANED RELAYER EXECUTION LOCKS (LOCKACTIVE)
        const relayerResult = await RelayerLock.updateMany(
            { 
                lockActive: true, 
                lockedAt: { $lt: thresholdDate } 
            },
            { $unset: { lockActive: '', lockedAt: '' } }
        )
        if (relayerResult.modifiedCount > 0) {
            console.log(`[STALE-LOCK-MONITOR] Liberados ${relayerResult.modifiedCount} locks huérfanos de RelayerLock (lockActive)`)
        }

    } catch (error) {
        console.error('[STALE-LOCK-MONITOR] Error en la limpieza de locks zombies:', error.message || error)
    }
}


// INITIALIZES DATABASE CONNECTION AND STARTS RECURRING STALE LOCK SWEEPER POLLER
connectDB.then(() => {
    console.log('[STALE-LOCK-MONITOR] Connected to MongoDB')
    console.log('[STALE-LOCK-MONITOR] Worker started, polling every', POLL_INTERVAL_MS, 'ms')
    checkStaleLocks()
    setInterval(checkStaleLocks, POLL_INTERVAL_MS)
}).catch(err => {
    console.error('[STALE-LOCK-MONITOR] Database connection failed:', err)
})
