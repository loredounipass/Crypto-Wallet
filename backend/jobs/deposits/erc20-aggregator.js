const appRoot = require('app-root-path')
const { Queue } = require(`${appRoot}/config/bullmq`)
const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
const Erc20Transaction = require(`${appRoot}/config/models/Erc20Transaction`)
const Erc20ForwardExecution = require(`${appRoot}/config/models/Erc20ForwardExecution`)
const { v4: uuidv4 } = require('uuid')


// BATCHING THRESHOLD AMOUNT AND ACCUMULATION WINDOW DURATION IN MILLISECONDS (1 MINUTE)
const THRESHOLD_AMOUNT = 100
const WINDOW_TIME_MS = 60000


// COORDINATES FINITE STATE MACHINE (IDLE, COLLECTING, DISPATCHING) TO BATCH ERC20 FORWARD EXECUTIONS
const processAggregation = async (job) => {
    // STEP 1: ATOMICALLY ACQUIRE AGGREGATOR MUTEX LOCK WITH 5-MINUTE STALE OVERRIDE
    const { walletAddress, tokenAddress, chainId, trigger_event } = job.data

    const lock = await Erc20Ledger.findOneAndUpdate(
        {
            walletAddress, tokenAddress, chainId,
            $or: [
                { aggregatorLock: { $ne: true } },
                { aggregatorLockedAt: { $lt: new Date(Date.now() - 300000) } }
            ]
        },
        { $set: { aggregatorLock: true, aggregatorLockedAt: new Date() } }
    )
    if (!lock) {
        console.log(`[AGGREGATOR] State machine is currently locked for ${walletAddress}. Will let current lock owner handle it.`)
        return 'locked'
    }

    try {
        // STEP 2: LOAD CURRENT LEDGER STATE MACHINE; SKIP IF DISPATCH IS CURRENTLY IN PROGRESS
        const ledger = await Erc20Ledger.findOne({ walletAddress, tokenAddress, chainId })
        let state = ledger?.aggregatorState || 'IDLE'

        if (state === 'DISPATCHING') {
            console.log(`[AGGREGATOR] Currently DISPATCHING for ${walletAddress}. Event ${trigger_event} will be picked up in next cycle.`)
            return 'dispatching'
        }

        // STEP 3: TRANSITION IDLE STATE TO COLLECTING PHASE ON INCOMING TRIGGER EVENT
        if (state === 'IDLE') {
            state = 'COLLECTING'
            await Erc20Ledger.updateOne(
                { walletAddress, tokenAddress, chainId },
                { $set: { aggregatorState: state, aggregatorLockedAt: new Date() } }
            )
        }

        // STEP 4: EVALUATE BATCHING CONDITIONS (WINDOW EXPIRY, TIMEOUT EVENT, OR THRESHOLD EXCEEDED)
        if (state === 'COLLECTING') {
            const lockedAmount = ledger ? ledger.locked_for_forward : 0

            const lockedAt = ledger?.aggregatorLockedAt || new Date(0)
            const elapsed = Date.now() - new Date(lockedAt).getTime()
            const isWindowExpired = elapsed >= WINDOW_TIME_MS

            const isWindowTimeout = trigger_event === 'window_timeout'
            const isThresholdReached = lockedAmount >= THRESHOLD_AMOUNT

            // STEP 5: ATOMICALLY TRANSITION TO DISPATCHING AND CREATE PENDING FORWARD EXECUTION RECORD
            if (isWindowTimeout || isThresholdReached || (isWindowExpired && lockedAmount > 0)) {
                await Erc20Ledger.updateOne(
                    { walletAddress, tokenAddress, chainId },
                    { $set: { aggregatorState: 'DISPATCHING' } }
                )

                const pendingTxs = await Erc20Transaction.find({
                    walletAddress, tokenAddress, chainId, status: 2
                })

                const eventIds = pendingTxs.map(tx => tx.eventId)

                if (eventIds.length > 0) {
                    const executionId = uuidv4()

                    try {
                        const forwardExecution = new Erc20ForwardExecution({
                            executionId,
                            chainId,
                            walletAddress,
                            tokenAddress,
                            amount: lockedAmount.toString(),
                            eventIds,
                            settlement_state: 'PENDING_FORWARD'
                        })
                        await forwardExecution.save()

                        const forwardingQueue = new Queue('erc20-forwarding')
                        await forwardingQueue.add('forward', { executionId }, {
                            attempts: 10,
                            backoff: { type: 'exponential', delay: 5000 }
                        })

                        console.log(`[AGGREGATOR] Dispatched execution ${executionId} for ${walletAddress} (Events: ${eventIds.length}, Amount: ${lockedAmount})`)

                        await Erc20Ledger.updateOne(
                            { walletAddress, tokenAddress, chainId },
                            { $set: { aggregatorState: 'IDLE', aggregatorLockedAt: null } }
                        )
                    } catch (dispatchErr) {
                        console.error(`[AGGREGATOR] Failed to dispatch execution for ${walletAddress}:`, dispatchErr.message)
                        await Erc20Ledger.updateOne(
                            { walletAddress, tokenAddress, chainId },
                            { $set: { aggregatorState: 'COLLECTING', aggregatorLockedAt: new Date() } }
                        )
                    }
                } else {
                    await Erc20Ledger.updateOne(
                        { walletAddress, tokenAddress, chainId },
                        { $set: { aggregatorState: 'IDLE', aggregatorLockedAt: null } }
                    )
                }
            } else {
                console.log(`[AGGREGATOR] Collecting for ${walletAddress}. Locked: ${lockedAmount}, Threshold: ${THRESHOLD_AMOUNT}, Elapsed: ${elapsed}ms`)
            }
        }
    } finally {
        // STEP 6: ATOMICALLY RELEASE AGGREGATOR MUTEX LOCK IN FINALLY BLOCK
        await Erc20Ledger.updateOne(
            { walletAddress, tokenAddress, chainId },
            { $unset: { aggregatorLock: '' } }
        )
    }

    return 'processed'
}


// EXPORTS AGGREGATION PROCESSOR FOR BULLMQ WORKER QUEUE
module.exports = processAggregation
