const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
const Erc20Transaction = require(`${appRoot}/config/models/Erc20Transaction`)
const Erc20ForwardExecution = require(`${appRoot}/config/models/Erc20ForwardExecution`)
const { Queue } = require(`${appRoot}/config/bullmq`)

const CHAIN_CONFIRMATIONS = {
    1: 12,
    137: 150,
    56: 30,
    42161: 20,
    10: 20,
    11155111: 6
}
const DEFAULT_CONFIRMATIONS = 12

const runReconciliation = async ({ chainId, tokenAddress, rpcUrl }) => {
    const web3 = new Web3(rpcUrl)
    console.log(`[RECONCILIATION] Starting reconciliation for ${chainId}:${tokenAddress}`)

    const latestBlock = Number(await web3.eth.getBlockNumber())
    const minConf = CHAIN_CONFIRMATIONS[chainId] || DEFAULT_CONFIRMATIONS
    const finalizedBlock = latestBlock - minConf

    const ledgers = await Erc20Ledger.find({ chainId, tokenAddress })

    const anomalyQueue = new Queue('erc20-anomaly-repair')

    for (const ledger of ledgers) {
        const { walletAddress, available_balance, locked_for_forward, forwarded_total } = ledger

        const finalizedTxs = await Erc20Transaction.find({
            walletAddress, tokenAddress, chainId, status: 2, blockNumber: { $lte: finalizedBlock }
        })
        const totalDepositsFromEvents = finalizedTxs.reduce((sum, tx) => sum + tx.amount, 0)

        const expectedNetBalance = totalDepositsFromEvents - (forwarded_total || 0)
        const actualHeld = available_balance + locked_for_forward

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

module.exports = { runReconciliation }
