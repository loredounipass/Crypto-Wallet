const appRoot = require('app-root-path')
const ObjectId = require('mongoose').Types.ObjectId
const { Web3 } = require('web3')
const { sendDepositEmail } = require('../notifications/mailService')

const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const coins = require(`${appRoot}/config/coins/info`)
const User = require(`${appRoot}/config/models/User`)
const { publishTransactionStatusUpdate } = require('../notifications/transactionStatusQueue')

let web3


// POLLING AND CONFIRMATION THRESHOLDS FOR MONITORING ON-CHAIN NATIVE DEPOSITS
const POLL_INTERVAL_MS = Number(process.env.CONFIRMATION_POLL_INTERVAL_MS || 10000)
const MAX_CONFIRMATION_POLLS = Number(process.env.MAX_CONFIRMATION_POLLS || 180)
const MIN_CONFIRMATIONS = Number(process.env.MIN_CONFIRMATIONS || 12)


// CONVERTS BIGINT OR STRING REPRESENTATIONS INTO NATIVE NUMERIC VALUES
const toNumber = (value) => {
    if (typeof value === 'bigint') return Number(value)
    if (typeof value === 'string') return Number(value)
    return value
}


// VALIDATES WHETHER THE GIVEN VALUE IS A FINITE NUMERIC VALUE
const isFiniteNumber = (value) => Number.isFinite(Number(value))


// CONVERTS RAW WEI OR BASE UNIT NUMERIC VALUE TO HUMAN-READABLE COIN AMOUNT USING DECIMALS
const toCoinAmount = (rawValue, coin) => {
    const decimals = coins[String(coin || '').toUpperCase()]?.decimals || 18
    const numeric = toNumber(rawValue)
    if (!isFiniteNumber(numeric)) return 0
    return Number(numeric) / 10 ** decimals
}


// THROWS RUNTIME ERROR TO REJECT DEPOSIT PROCESSING AND TRIGGER BULLMQ RETRY
const reject = (message = 'err: not deposited') => {
    throw new Error(message)
}


// ATOMICALLY UPDATES TRANSACTION STATUS AND CONFIRMATIONS, PUBLISHING REAL-TIME UI NOTIFICATION
const _updateTransactionState = async (tId, status, value, confirmations, enrichment = {}) => {
    const upsert = {
        status
    }

    if (confirmations !== undefined && confirmations !== null) {
        upsert.confirmations = confirmations
    }

    if (value !== undefined && value !== null && isFiniteNumber(value)) {
        upsert.amount = Number(value)
    }

    await Transaction.updateOne({ _id: new ObjectId(tId) }, {
        $set: upsert
    })

    await publishTransactionStatusUpdate({
        transactionId: tId.toString(),
        status,
        confirmations: upsert.confirmations ?? 0,
        amount: upsert.amount ?? enrichment.amount,
        nature: 1,
        coin: enrichment.coin,
        chainId: enrichment.chainId,
        txHash: enrichment.txHash,
        to: enrichment.to,
        fee: 0
    })
}


// ATOMICALLY CREDITS WALLET BALANCE AND SENDS CONFIRMATION EMAIL UPON REACHING FINALITY
const _deposit = async (transactionId, chainId, coin, address, value, txHash) => {
    console.log('[DEPOSIT] applying balance increment', {
        transactionId,
        chainId,
        coin,
        address,
        value
    })

    // STEP 1: VERIFY IF TRANSACTION HAS ALREADY BEEN PROCESSED TO PREVENT DUPLICATES
    const txCheck = await Transaction.findOne({ _id: new ObjectId(transactionId) })
    if (txCheck && txCheck.status === 3) {
        console.log('[DEPOSIT] Transaction already completed (early check), skipping:', { transactionId })
        return 'deposit_already_processed'
    }

    // STEP 2: ATOMICALLY CLAIM FINAL STATUS (STATUS 3) TO PREVENT CONCURRENT EXECUTION
    const claimed = await Transaction.findOneAndUpdate(
        { _id: new ObjectId(transactionId), status: { $ne: 3 } },
        { $set: { status: 3, confirmations: MIN_CONFIRMATIONS } }
    )
    if (!claimed) {
        console.log('[DEPOSIT] Transaction already processed (status=3), skipping duplicate balance credit:', {
            transactionId
        })
        return 'deposit_already_processed'
    }

    // STEP 3: PUBLISH TRANSACTION COMPLETION NOTIFICATION EVENT TO STATUS QUEUE
    await publishTransactionStatusUpdate({
        transactionId,
        status: 3,
        confirmations: MIN_CONFIRMATIONS,
        amount: value,
        nature: 1,
        coin,
        chainId,
        txHash,
        to: address,
        fee: 0
    })

    // STEP 4: ATOMICALLY INCREMENT WALLET BALANCE OR MARK TRANSACTION AS FAILED
    const result = await Wallet.updateOne({
        address, coin, chainId
    }, {
        $inc: { balance: value }
    })

    if (result.matchedCount === 0) {
        console.error('[DEPOSIT] Wallet not found for credit:', {
            transactionId,
            address,
            coin,
            chainId
        })
        await Transaction.updateOne(
            { _id: new ObjectId(transactionId) },
            { $set: { status: 4 } }
        )
        reject('err: wallet not found for deposit')
        return
    }

    // STEP 5: LOCATE ASSOCIATED USER RECORD AND DISPATCH DEPOSIT CONFIRMATION EMAIL
    const wallet = await Wallet.findOne({
        transactions: new ObjectId(transactionId)
    })
    if (!wallet) {
        console.warn('[DEPOSIT] Wallet with matching transaction not found for email notification:', {
            transactionId
        })
        return 'deposit'
    }
    const user = await User.findOne({
        wallets: new ObjectId(wallet._id)
    })
    if (user && user.email) {
        try {
            await sendDepositEmail(value, coin, user.email)
        } catch (error) {
            console.error('[DEPOSIT] notification email failed', error?.message || error)
        }
    }
    return 'deposit'
}


// VERIFIES ON-CHAIN TRANSACTION RECEIPT STATUS BEFORE INVOKING BALANCE DEPOSIT CREDIT
const _checkConfirmation = async (
    address, txHash, amount, coin, chainId, transactionId
) => {
    // STEP 1: FETCH ON-CHAIN RECEIPT AND CONFIRM SUCCESSFUL STATUS BEFORE CREDITING
    var result = await web3.eth.getTransactionReceipt(txHash)
    if (result && 'status' in result && result.status) {
        console.log('[DEPOSIT] receipt confirmed, processing credit', {
            transactionId,
            txHash,
            chainId,
            coin
        })
        return _deposit(transactionId, chainId, coin, address, amount, txHash)
    }

    reject()
}


// ASYNCHRONOUS DELAY HELPER FOR POLLING INTERVAL BACKOFF
const _sleep = async (ms) => {
    return await new Promise((resolve) => setTimeout(resolve, ms))
}


// ORCHESTRATES ON-CHAIN TRANSACTION CONFIRMATION POLLING AND DISPATCHES DEPOSIT CREDIT
const processDeposit = async (
    { walletAddress, transactionHash, transactionId, chainId, coin }
) => {
    // STEP 1: INITIALIZE WEB3 PROVIDER FOR TARGET CHAIN AND LOAD TRACKED TRANSACTION
    console.log('[DEPOSIT] processing started', {
        walletAddress,
        transactionHash,
        transactionId,
        chainId,
        coin
    })
    web3 = new Web3(require(`${appRoot}/config/chains/${chainId}`).rpc)
    let trackedTransaction = await Transaction.findOne({ _id: new ObjectId(transactionId) })
    if (trackedTransaction) {
        // STEP 2: POLL ON-CHAIN TRANSACTION DETAILS AND CALCULATE CONFIRMATIONS AND AMOUNT
        for (let poll = 0; poll < MAX_CONFIRMATION_POLLS; poll++) {
            const chainTx = await web3.eth.getTransaction(transactionHash)
            if (chainTx && 'value' in chainTx) {
                const { value, blockNumber } = chainTx
                if (blockNumber !== null && blockNumber !== undefined) {
                    const latestBlockNumber = await web3.eth.getBlockNumber()
                    const confirmations = Number(latestBlockNumber - blockNumber)
                    const chainAmount = toCoinAmount(value, coin)
                    const storedAmount = Number(trackedTransaction.amount)
                    const amount = chainAmount > 0
                        ? chainAmount
                        : (isFiniteNumber(storedAmount) ? storedAmount : 0)

                    if (chainAmount === 0 && isFiniteNumber(storedAmount) && storedAmount > 0) {
                        console.warn('[DEPOSIT] On-chain value is 0 but stored amount > 0. Possible ERC-20 token transfer — deposit pipeline only supports native coins.', {
                            transactionId,
                            txHash: transactionHash,
                            storedAmount,
                            coin
                        })
                    } else if (chainAmount === 0 && amount === 0) {
                        console.error('[DEPOSIT] Cannot determine deposit amount: on-chain value is 0 and no stored amount available.', {
                            transactionId,
                            txHash: transactionHash
                        })
                    }

                    console.log('[DEPOSIT] transaction found on chain', {
                        transactionId,
                        confirmations,
                        blockNumber,
                        chainAmount,
                        trackedAmount: amount
                    })

                    // STEP 3: UPDATE TRANSACTION CONFIRMATIONS AND BROADCAST INTERMEDIATE STATE
                    await _updateTransactionState(
                        transactionId,
                        2,
                        amount,
                        confirmations,
                        { coin, chainId, txHash: transactionHash, to: walletAddress }
                    )

                    // STEP 4: CHECK IF MINIMUM CONFIRMATION THRESHOLD IS REACHED AND EXECUTE FINAL RECEIPT VERIFICATION
                    if (confirmations >= MIN_CONFIRMATIONS) {
                        console.log('[DEPOSIT] minimum confirmations reached', {
                            transactionId,
                            minConfirmations: MIN_CONFIRMATIONS
                        })
                        return await _checkConfirmation(
                            walletAddress,
                            transactionHash,
                            amount,
                            coin,
                            chainId,
                            transactionId
                        )
                    }

                    console.log('[DEPOSIT] waiting for more confirmations', {
                        transactionId,
                        confirmations,
                        minConfirmations: MIN_CONFIRMATIONS
                    })
                } else {
                    console.log('[DEPOSIT] transaction is pending inclusion in block', {
                        transactionId,
                        poll: poll + 1
                    })
                }
            }

            // STEP 5: HANDLE PENDING BLOCK INCLUSION OR THROW TIMEOUT EXCEPTION ON MAX RETRIES
            trackedTransaction = await Transaction.findOne({ _id: new ObjectId(transactionId) })
            await _sleep(POLL_INTERVAL_MS)
        }

        reject(`err: confirmation timeout after ${MAX_CONFIRMATION_POLLS} polls`)
    }

    reject()
}


// EXPORTS DEPOSIT PROCESSOR FOR BULLMQ WORKER QUEUES
module.exports = processDeposit
