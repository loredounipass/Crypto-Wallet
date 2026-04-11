const appRoot = require('app-root-path')
const ObjectId = require('mongoose').Types.ObjectId
const { Web3 } = require('web3')
const { sendDepositEmail } = require('../notifications/mailService')

const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const coins = require(`${appRoot}/config/coins/info`)
const User = require(`${appRoot}/config/models/User`)

let web3

const POLL_INTERVAL_MS = Number(process.env.CONFIRMATION_POLL_INTERVAL_MS || 10000)
const MAX_CONFIRMATION_POLLS = Number(process.env.MAX_CONFIRMATION_POLLS || 180)

const toNumber = (value) => {
    if (typeof value === 'bigint') return Number(value)
    if (typeof value === 'string') return Number(value)
    return value
}

const toCoinAmount = (rawValue, coin) => {
    const decimals = coins[coin]?.decimals || 18
    return toNumber(rawValue) / 10 ** decimals
}

const reject = (message = 'err: not deposited') => {
    throw new Error(message)
}

const _updateTransactionState = async (tId, status, value, confirmations) => {
    const upsert = {
        status
    }

    if (confirmations !== undefined && confirmations !== null) {
        upsert.confirmations = confirmations
    }

    if (value) {
        upsert.amount = value
    }

    await Transaction.updateOne({ _id: ObjectId(tId) }, {
        $set: upsert
    })
}

const _deposit = async (transactionId, chainId, coin, address, value) => {
    console.log('[DEPOSIT] applying balance increment', {
        transactionId,
        chainId,
        coin,
        address,
        value
    })
    var result = await Wallet.updateOne({
        address, coin, chainId
    }, {
        $inc: { balance: value }
    })

    if (result) {
        await _updateTransactionState(transactionId, 3, value)
        const wallet = await Wallet.findOne({
            transactions: ObjectId(transactionId)
        })
        const user = await User.findOne({
            wallets: ObjectId(wallet._id)
        })
        if (user && user.email) {
            try {
                await sendDepositEmail(value, coin, user.email)
            } catch (error) {
                console.error('[DEPOSIT] notification email failed', error?.message || error)
            }
        }
        return 'deposit'
    } else {
        await _updateTransactionState(transactionId, 4)
        reject()
    }
}

const _checkConfirmation = async (
    address, txHash, value, coin, chainId, transactionId
) => {
    var result = await web3.eth.getTransactionReceipt(txHash)
    if (result && 'status' in result && result.status) {
        console.log('[DEPOSIT] receipt confirmed, processing credit', {
            transactionId,
            txHash,
            chainId,
            coin
        })
        return _deposit(transactionId, chainId, coin, address, toCoinAmount(value, coin))
    }

    reject()
}

const _sleep = async (ms) => {
    return await new Promise((resolve) => setTimeout(resolve, ms))
}

const processDeposit = async (
    { walletAddress, transactionHash, transactionId, chainId, coin }
) => {
    console.log('[DEPOSIT] processing started', {
        walletAddress,
        transactionHash,
        transactionId,
        chainId,
        coin
    })
    web3 = new Web3(require(`${appRoot}/config/chains/${chainId}`).rpc)
    var result = await Transaction.findOne({ _id: ObjectId(transactionId) })
    if (result) {
        const minConfirmations = Number(process.env.MIN_CONFIRMATIONS || 0)
        for (let poll = 0; poll < MAX_CONFIRMATION_POLLS; poll++) {
            result = await web3.eth.getTransaction(transactionHash)
            if (result && 'value' in result) {
                const { value, blockNumber } = result
                if (blockNumber !== null && blockNumber !== undefined) {
                    const latestBlockNumber = await web3.eth.getBlockNumber()
                    const confirmations = Number(latestBlockNumber - blockNumber)
                    const amount = toCoinAmount(value, coin)
                    console.log('[DEPOSIT] transaction found on chain', {
                        transactionId,
                        confirmations,
                        blockNumber
                    })
                    await _updateTransactionState(
                        transactionId,
                        2,
                        amount,
                        confirmations
                    )
                    if (confirmations >= minConfirmations) {
                        console.log('[DEPOSIT] minimum confirmations reached', {
                            transactionId,
                            minConfirmations
                        })
                        return await _checkConfirmation(
                            walletAddress,
                            transactionHash,
                            value,
                            coin,
                            chainId,
                            transactionId
                        )
                    }

                    console.log('[DEPOSIT] waiting for more confirmations', {
                        transactionId,
                        confirmations,
                        minConfirmations
                    })
                } else {
                    console.log('[DEPOSIT] transaction is pending inclusion in block', {
                        transactionId,
                        poll: poll + 1
                    })
                }
            }

            await _sleep(POLL_INTERVAL_MS)
        }

        reject(`err: confirmation timeout after ${MAX_CONFIRMATION_POLLS} polls`)
    }

    reject()
}

module.exports = processDeposit
