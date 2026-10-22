const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
const Erc20Transaction = require(`${appRoot}/config/models/Erc20Transaction`)
const Erc20ForwardExecution = require(`${appRoot}/config/models/Erc20ForwardExecution`)
const { Queue } = require(`${appRoot}/config/bullmq`)


// REQUIRED FINALITY CONFIRMATION BLOCKS PER CHAIN ID TO AUDIT FINALIZED TRANSACTIONS
const CHAIN_CONFIRMATIONS = {
    1: 12,
    137: 150,
    56: 30,
    42161: 20,
    10: 20,
    11155111: 6
}
const DEFAULT_CONFIRMATIONS = 12


// RECONCILES ERC20 LEDGER BALANCES AGAINST FINALIZED ON-CHAIN DEPOSIT EVENTS AND FORWARD TOTALS
const runReconciliation = async ({ chainId, tokenAddress, rpcUrl }) => {
    // STEP 1: INITIALIZE WEB3 PROVIDER AND CALCULATE FINALIZED BLOCK NUMBER USING CHAIN THRESHOLDS
    const web3 = new Web3(rpcUrl)
    console.log(`[RECONCILIATION] Starting reconciliation for ${chainId}:${tokenAddress}`)

    const latestBlock = Number(await web3.eth.getBlockNumber())
    const minConf = CHAIN_CONFIRMATIONS[chainId] || DEFAULT_CONFIRMATIONS
    const finalizedBlock = latestBlock - minConf

    // STEP 2: LOAD ALL ERC20 LEDGERS FOR TARGET TOKEN AND INITIALIZE ANOMALY REPAIR QUEUE
    const ledgers = await Erc20Ledger.find({ chainId, tokenAddress })

    const anomalyQueue = new Queue('erc20-anomaly-repair')

    for (const ledger of ledgers) {
        // STEP 3: AGGREGATE FINALIZED ON-CHAIN DEPOSITS AND CALCULATE EXPECTED NET HELD BALANCE
        const { walletAddress, available_balance, locked_for_forward, forwarded_total } = ledger

        const finalizedTxs = await Erc20Transaction.find({
            walletAddress, tokenAddress, chainId, status: 2, blockNumber: { $lte: finalizedBlock }
        })
        const totalDepositsFromEvents = finalizedTxs.reduce((sum, tx) => sum + tx.amount, 0)

        const expectedNetBalance = totalDepositsFromEvents - (forwarded_total || 0)
        const actualHeld = available_balance + locked_for_forward

        // STEP 4: DETECT LEDGER DRIFT AND ENQUEUE ANOMALY REPAIR AUDIT JOB WHEN DRIFT EXCEEDS TOLERANCE
        if (Math.abs(expectedNetBalance - actualHeld) > 0.0001) {
            console.warn(`[RECONCILIATION] Drift detected for ${walletAddress}. ` +
                `Deposits: ${totalDepositsFromEvents}, Forwarded: ${forwarded_total}, ` +
                `Expected Held: ${expectedNetBalance}, Actual Held: ${actualHeld}`)

            const jobId = `reconcile-drift-${chainId}-${tokenAddress}-${walletAddress}`

            await anomalyQueue.add('repair-audit', {
                walletAddress,
                tokenAddress,
                chainId,
                issue: 'LEDGER_DRIFT',
                depositsTotal: totalDepositsFromEvents,
                forwardedTotal: forwarded_total || 0,
                expectedNetBalance,
                actualAvailable: available_balance,
                actualLocked: locked_for_forward
            }, { jobId })
        }
    }
}


// EXPORTS RECONCILIATION AUDIT RUNNER FOR SCHEDULED AND MANUAL EXECUTION
module.exports = { runReconciliation }
