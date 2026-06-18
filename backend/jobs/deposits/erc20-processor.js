const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const { Queue } = require(`${appRoot}/config/bullmq`)
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

        if (confirmations < minConf) {
            console.log(`[ERC20-PROCESSOR] Event ${eventId} pending confirmations: ${confirmations}/${minConf}. Requeuing.`)
            throw new Error(`Insufficient confirmations: ${confirmations}`)
        }

        let tokenInfo = getTokenInfo(tokenAddress)
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

        try {
            const txRecord = new Transaction({
                nature: 1,
                txHash,
                amount: displayAmount,
                status: 3,
                to: walletAddress,
                tokenSymbol: symbol,
                created_at: new Date()
            })
            await txRecord.save()
            await Wallet.updateOne(
                { address: new RegExp(`^${walletAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                { $push: { transactions: txRecord._id } }
            )
        } catch (txErr) {
            console.error(`[ERC20-PROCESSOR] Failed to create Transaction record for ${eventId}:`, txErr.message)
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
        console.error(`[ERC20-PROCESSOR] Error processing event ${eventId}:`, e.message)
        throw e
    }
}

module.exports = processERC20Event
