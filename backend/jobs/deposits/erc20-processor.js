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
    11155111: 6,
    80002: 6,
    14601: 6,
    97: 6,
    43113: 6,
    11155420: 6
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
            try {
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
            } catch (saveErr) {
                if (saveErr.code === 11000) {
                    console.log(`[ERC20-PROCESSOR] Duplicate {txHash,nature}, reusing existing doc:`, txHash)
                    txRecord = await Transaction.findOne({ txHash, nature: 1 })
                    if (!txRecord) throw saveErr
                } else {
                    throw saveErr
                }
            }
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
                confirmations: confirmations,
                nature: 1,
                amount: displayAmount,
                tokenSymbol: symbol,
                txHash,
                chainId,
                to: walletAddress,
                fee: 0
            })
        } catch (pubErr) {
            console.error(`[ERC20-PROCESSOR] Failed to publish status update:`, pubErr.message)
        }

        if (confirmations < minConf) {
            console.log(`[ERC20-PROCESSOR] Event ${eventId} pending confirmations: ${confirmations}/${minConf}. Requeuing.`)
            await job.moveToDelayed(Date.now() + 15000, job.token)
            throw new DelayedError()
        }

        // IDEMPOTENCIA EN 2 FASES (fix doble-credito 2026-10-04):
        // Fase 1: upsert atomico -> un solo doc por eventId aunque N jobs concurran.
        // Fase 2: claim atomico de ledgerApplied -> solo el ganador hace el $inc.
        // El claim va ANTES del $inc: si el proceso muere entre ambos, el evento
        // queda marcado sin acreditar y el reconciliation-job lo detecta como drift
        // (reparable). El orden inverso crearia dinero de la nada. Sin replica-set
        // no hay transacciones multi-doc, este es el patron correcto.
        await Erc20Transaction.findOneAndUpdate(
            { eventId },
            {
                $setOnInsert: {
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
                }
            },
            { upsert: true }
        )
        const claimed = await Erc20Transaction.findOneAndUpdate(
            { eventId, ledgerApplied: { $ne: true } },
            { $set: { ledgerApplied: true } }
        )
        if (!claimed) {
            console.log(`[ERC20-PROCESSOR] Event ${eventId} already processed (Idempotency Hit).`)
            return 'duplicate'
        }
        await Erc20Ledger.findOneAndUpdate(
            { walletAddress, tokenAddress, chainId },
            { $inc: { available_balance: displayAmount, locked_for_forward: displayAmount } },
            { upsert: true }
        )

        console.log(`[ERC20-PROCESSOR] Event ${eventId} Ledger Updated for wallet ${walletAddress}. Amount: ${displayAmount} ${symbol}`)

        // CLAIM ATOMICO: SOLO EL GANADOR PUBLICA Y ENVIA EMAIL (EVITA DUPLICADOS CONCURRENTES)
        let emailClaim = null
        if (txRecord) {
            emailClaim = await Transaction.findOneAndUpdate(
                { _id: txRecord._id, status: { $ne: 3 } },
                { $set: { status: 3, confirmations: confirmations } }
            )
        }
        if (emailClaim) {
            try {
                const { publishTransactionStatusUpdate } = require(`${appRoot}/jobs/notifications/transactionStatusQueue`)
                await publishTransactionStatusUpdate({
                    transactionId: txRecord._id.toString(),
                    status: 3,
                    confirmations: confirmations,
                    nature: 1,
                    amount: displayAmount,
                    tokenSymbol: symbol,
                    txHash,
                    chainId,
                    to: walletAddress,
                    fee: 0
                })
            } catch (pubErr) {}
            // EMAIL DE DEPOSITO ERC20 (PARIDAD CON DEPOSITOS NATIVOS)
            try {
                const WalletForEmail = require(`${appRoot}/config/models/Wallet`)
                const UserForEmail = require(`${appRoot}/config/models/User`)
                const { sendDepositEmail } = require(`${appRoot}/jobs/notifications/mailService`)
                const w = await WalletForEmail.findOne({ transactions: txRecord._id }, { _id: 1 }).lean()
                const u = w ? await UserForEmail.findOne({ wallets: w._id }, { email: 1 }).lean() : null
                if (u && u.email) {
                    await sendDepositEmail(displayAmount, symbol, u.email)
                }
            } catch (mailErr) {
                console.error('[ERC20-PROCESSOR] deposit notification email failed', mailErr?.message || mailErr)
            }
        }

        const aggregationQueue = new Queue('erc20-aggregation')
        await aggregationQueue.add('aggregate', {
            walletAddress,
            tokenAddress,
            chainId,
            trigger_event: eventId
        }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 3000 },
            removeOnComplete: { age: 86400, count: 500 },
            removeOnFail: 50
        })

        return 'processed'

    } catch (e) {
        if (e instanceof DelayedError || e.name === 'DelayedError' || (e.message && e.message.includes('bullmq:movedToDelayed'))) {
            // Flujo normal: el job fue movido a delayed para esperar confirmaciones
            throw e
        }
        console.error(`[ERC20-PROCESSOR] REAL error processing event ${eventId}:`, e.message)
        throw e
    }
}

module.exports = processERC20Event
