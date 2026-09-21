const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const { Queue } = require(`${appRoot}/config/bullmq`)
const { DelayedError } = require('bullmq')
const Erc20Transaction = require(`${appRoot}/config/models/Erc20Transaction`)
const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { getTokenInfo } = require(`${appRoot}/config/tokens`)

const CHAIN_CONFIRMATIONS = {
    1: 12,
    137: 150,
    56: 30,
    42161: 20,
    10: 20,
    11155111: 6
}
const DEFAULT_CONFIRMATIONS = 12

const ERC20_ABI_DECIMALS = [
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "","type": "uint8"}],
        "type": "function"
    }
]

function toDisplayNumber(amountWei, decimals) {
    const divisor = BigInt(10) ** BigInt(decimals)
    const whole = amountWei / divisor
    const remainder = amountWei % divisor
    const fractionalStr = remainder.toString().padStart(decimals, '0').slice(0, 8)
    return Number(whole.toString() + '.' + fractionalStr)
}

const processERC20Event = async (job) => {
    const { eventId, chainId, txHash, logIndex, blockNumber, tokenAddress, walletAddress, amount } = job.data

    console.log(`[ERC20-PROCESSOR] Processing event ${eventId} on block ${blockNumber}`)

    try {
        const rpcUrl = require(`${appRoot}/config/chains/${chainId}`).rpc
        const web3 = new Web3(rpcUrl)
        const latestBlockNumber = Number(await web3.eth.getBlockNumber())
        const confirmations = latestBlockNumber - blockNumber
        const minConf = CHAIN_CONFIRMATIONS[chainId] || DEFAULT_CONFIRMATIONS

        let tokenInfo = getTokenInfo(chainId, tokenAddress)
        let decimals
        if (tokenInfo?.decimals != null) {
            decimals = tokenInfo.decimals
        } else {
            try {
                const tokenContract = new web3.eth.Contract(ERC20_ABI_DECIMALS, tokenAddress)
                decimals = Number(await tokenContract.methods.decimals().call())
            } catch {
                decimals = 18
            }
        }
        const symbol = tokenInfo?.symbol || 'UNKNOWN'

        const amountBig = BigInt(amount)
        const displayAmount = toDisplayNumber(amountBig, decimals)

        let txRecord = await Transaction.findOne({
            nature: 1,
            txHash,
            to: walletAddress,
            tokenSymbol: symbol,
            amount: displayAmount
        })

        if (!txRecord) {
            txRecord = new Transaction({
                nature: 1,
                txHash,
                amount: displayAmount,
                status: 2,
                to: walletAddress,
                tokenSymbol: symbol,
                confirmations: confirmations,
                created_at: new Date()
            })
            await txRecord.save()
            await Wallet.updateOne(
                { address: new RegExp(`^${walletAddress.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') },
                { $push: { transactions: txRecord._id } }
            )
        } else if (txRecord.status !== 3) {
            txRecord.confirmations = confirmations
            await txRecord.save()
        }

        try {
            const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)
            await publishTransactionStatusUpdate({
                transactionId: txRecord._id.toString(),
                status: txRecord.status,
                confirmations: confirmations
            })
        } catch (pubErr) {
            console.error(`[ERC20-PROCESSOR] Failed to publish status update:`, pubErr.message)
        }

        if (confirmations < minConf) {
            console.log(`[ERC20-PROCESSOR] Event ${eventId} pending confirmations: ${confirmations}/${minConf}. Requeuing.`)
            await job.moveToDelayed(Date.now() + 15000, job.token)
            throw new DelayedError()
        }

        const existing = await Erc20Transaction.findOne({ eventId })

        if (existing) {
            if (!existing.ledgerApplied) {
                await Erc20Ledger.findOneAndUpdate(
                    { walletAddress, tokenAddress, chainId },
                    {
                        $inc: {
                            available_balance: displayAmount,
                            locked_for_forward: displayAmount
                        }
                    },
                    { upsert: true }
                )
                await Erc20Transaction.updateOne({ eventId }, { $set: { ledgerApplied: true } })
            }
            console.log(`[ERC20-PROCESSOR] Event ${eventId} already processed (Idempotency Hit).`)
            return 'duplicate'
        }

        try {
            const transaction = new Erc20Transaction({
                eventId,
                chainId,
                txHash,
                logIndex,
                walletAddress,
                tokenAddress,
                amount: displayAmount,
                amountRaw: amountBig.toString(),
                blockNumber,
                confirmations,
                status: 2,
                ledgerApplied: false
            })
            await transaction.save()
        } catch (err) {
            if (err.code === 11000) {
                const tx = await Erc20Transaction.findOne({ eventId })
                if (tx && !tx.ledgerApplied) {
                    await Erc20Ledger.findOneAndUpdate(
                        { walletAddress, tokenAddress, chainId },
                        { $inc: { available_balance: displayAmount, locked_for_forward: displayAmount } },
                        { upsert: true }
                    )
                    await Erc20Transaction.updateOne({ eventId }, { $set: { ledgerApplied: true } })
                }
                return 'duplicate'
            }
            throw err
        }

        await Erc20Ledger.findOneAndUpdate(
            { walletAddress, tokenAddress, chainId },
            { $inc: { available_balance: displayAmount, locked_for_forward: displayAmount } },
            { upsert: true }
        )

        await Erc20Transaction.updateOne({ eventId }, { $set: { ledgerApplied: true } })

        console.log(`[ERC20-PROCESSOR] Event ${eventId} Ledger Updated for wallet ${walletAddress}. Amount: ${displayAmount} ${symbol}`)

        if (txRecord && txRecord.status !== 3) {
            txRecord.status = 3
            txRecord.confirmations = confirmations
            await txRecord.save()
            try {
                const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)
                await publishTransactionStatusUpdate({
                    transactionId: txRecord._id.toString(),
                    status: 3,
                    confirmations: confirmations
                })
            } catch (pubErr) {}
        }

        const aggregationQueue = new Queue('erc20-aggregation')
        await aggregationQueue.add('aggregate', {
            walletAddress,
            tokenAddress,
            chainId,
            trigger_event: eventId
        })

        return 'processed'

    } catch (e) {
        if (e.name === 'DelayedError' || e.message === 'bullmq:movedToDelayed') {
            throw e
        }
        console.error(`[ERC20-PROCESSOR] Error processing event ${eventId}:`, e.message)
        throw e
    }
}

module.exports = processERC20Event
