const appRoot = require('app-root-path')
const ObjectId = require('mongoose').Types.ObjectId
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const User = require(`${appRoot}/config/models/User`)
const coins = require(`${appRoot}/config/coins/info`)
const { Web3 } = require('web3')
const { sendWithdrawEmail } = require('../notifications/mailService')
const { publishTransactionStatusUpdate } = require('../notifications/transactionStatusQueue')


// MODULE LEVEL WEB3 CLIENT INSTANCE
let web3


// POLLING AND CONFIRMATION THRESHOLD CONFIGURATION
const POLL_INTERVAL_MS = Number(process.env.CONFIRMATION_POLL_INTERVAL_MS || 10000)
const MAX_CONFIRMATION_POLLS = Number(process.env.MAX_CONFIRMATION_POLLS || 180)
const MIN_CONFIRMATIONS = Number(process.env.MIN_CONFIRMATIONS || 12)


// CONVERTS WEI RAW INTEGER VALUE TO FORMATTED COIN AMOUNT
const toCoinAmount = (rawValue, coin) => {
    const decimals = coins[coin.toUpperCase()]?.decimals || 18
    if (typeof rawValue === 'bigint') {
        return Number(rawValue) / 10 ** decimals
    }
    if (typeof rawValue === 'string') {
        return Number(rawValue) / 10 ** decimals
    }
    return rawValue / 10 ** decimals
}


// THROWS STANDARDIZED WITHDRAWAL REJECTION ERROR
const reject = (message = 'error: not withdrawed') => {
    throw new Error(message)
}


// ATOMICALLY UPDATES TRANSACTION STATE AND DISPATCHES REAL-TIME STATUS EVENT
const _updateTransactionState = async (tId, status, confirmations, enrichment = {}) => {
    const upsert = {
        status
    }

    if (confirmations !== undefined && confirmations !== null)
        upsert.confirmations = confirmations

    await Transaction.updateOne({ _id: new ObjectId(tId) }, {
        $set: upsert
    })

    await publishTransactionStatusUpdate({
        transactionId: tId.toString(),
        status,
        confirmations: upsert.confirmations ?? 0,
        nature: 2,
        coin: enrichment.coin,
        chainId: enrichment.chainId,
        txHash: enrichment.txHash,
        to: enrichment.to,
        amount: enrichment.amount,
        fee: enrichment.fee ?? 0
    })
}


// VERIFIES MINED RECEIPT STATUS, MARKS TRANSACTION COMPLETE, AND SENDS NOTIFICATION EMAIL
const _checkConfirmation = async (address, txHash, value, coin, chainId, transactionId) => {
    // STEP 1: VERIFY TRANSACTION RECEIPT STATUS ON-CHAIN
    var result = await web3.eth.getTransactionReceipt(txHash)
    if (result && 'status' in result && result.status) {
        // STEP 2: FINALIZE TRANSACTION AS CONFIRMED AND DISPATCH STATUS UPDATE
        await _updateTransactionState(transactionId, 3, undefined, { coin, chainId, txHash, to: address, amount: toCoinAmount(value, coin) })
        
        // STEP 3: RESOLVE ASSOCIATED USER AND DISPATCH WITHDRAWAL CONFIRMATION EMAIL
        const wallet = await Wallet.findOne({ transactions: new ObjectId(transactionId) })
        if (wallet) {
            const user = await User.findOne({ wallets: new ObjectId(wallet._id) })
            if (user && user.email) {
                try {
                    await sendWithdrawEmail(toCoinAmount(value, coin), coin, address, txHash, user.email)
                } catch (error) {
                    console.error('[WITHDRAW] notification email failed', error?.message || error)
                }
            }
        }
        return 'withdrawed'
    }

    reject()
}


// PAUSES ASYNCHRONOUS EXECUTION FOR SPECIFIED MILLISECONDS
const _sleep = async (ms) => {
    return await new Promise((resolve) => setTimeout(resolve, ms))
}


// POLLS ON-CHAIN CONFIRMATIONS FOR WITHDRAWAL TRANSACTION UNTIL REACHING MINIMUM FINALITY
const processWithdraw = async ({
    walletAddress, transactionHash, transactionId, chainId, coin
}) => {
    // STEP 1: INITIALIZE WEB3 PROVIDER AND RESOLVE VALID ON-CHAIN TRANSACTION HASH
    web3 = new Web3(require(`${appRoot}/config/chains/` + chainId).rpc)
    var result = await Transaction.findOne({ _id: new ObjectId(transactionId) })
    if (result) {
        const hashToTrack = transactionHash || result.linkedTxHash || result.txHash
        if (!hashToTrack || !/^0x[a-fA-F0-9]{64}$/.test(hashToTrack)) {
            throw new Error(`[WITHDRAW] No valid hash to track: ${hashToTrack}`)
        }

        // STEP 2: POLL ON-CHAIN TRANSACTION CONFIRMATIONS UP TO CONFIGURED MAXIMUM
        for (let poll = 0; poll < MAX_CONFIRMATION_POLLS; poll++) {
            result = await web3.eth.getTransaction(hashToTrack)
            if (result && 'value' in result) {
                const { value, blockNumber } = result
                if (blockNumber !== null && blockNumber !== undefined) {
                    const latestBlockNumber = await web3.eth.getBlockNumber()
                    const confirmations = Number(latestBlockNumber - blockNumber)
                    
                    // STEP 3: UPDATE INTERMEDIATE CONFIRMATIONS COUNT AND DISPATCH STATUS
                    await _updateTransactionState(transactionId, 2, confirmations, { coin, chainId, txHash: hashToTrack, to: walletAddress, amount: toCoinAmount(value, coin) })
                    
                    // STEP 4: VERIFY FINAL TRANSACTION RECEIPT ONCE MINIMUM CONFIRMATIONS MET
                    if (confirmations >= MIN_CONFIRMATIONS) {
                        return await _checkConfirmation(
                            walletAddress, transactionHash, value, coin, chainId, transactionId
                        )
                    }

                    console.log('[WITHDRAW] waiting for more confirmations', {
                        transactionId,
                        confirmations,
                        minConfirmations: MIN_CONFIRMATIONS
                    })
                } else {
                    console.log('[WITHDRAW] transaction is pending inclusion in block', {
                        transactionId,
                        poll: poll + 1
                    })
                }
            }

            await _sleep(POLL_INTERVAL_MS)
        }

        // STEP 5: HANDLE CONFIRMATION TIMEOUT EXHAUSTION
        reject(`error: confirmation timeout after ${MAX_CONFIRMATION_POLLS} polls`)
    }

    reject()
}


// EXPORTS WITHDRAWAL CONFIRMATION MONITOR FOR BACKGROUND QUEUE WORKERS
module.exports = processWithdraw
