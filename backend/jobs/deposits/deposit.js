const appRoot = require('app-root-path')
const ObjectId = require('mongoose').Types.ObjectId
const { Web3 } = require('web3')
const { sendDepositEmail } = require('../notifications/mailService')

const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const coins = require(`${appRoot}/config/coins/info`)
const User = require(`${appRoot}/config/models/User`)

let web3

const toNumber = (value) => {
    if (typeof value === 'bigint') return Number(value)
    if (typeof value === 'string') return Number(value)
    return value
}

const toCoinAmount = (rawValue, coin) => {
    const decimals = coins[coin]?.decimals || 18
    return toNumber(rawValue) / 10 ** decimals
}

const reject = () => {
    throw 'err: not deposited'
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
            sendDepositEmail(value, coin, user.email)
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
        result = await web3.eth.getTransaction(transactionHash)
        if (result && 'value' in result) {
            const { value, blockNumber } = result
            const latestBlockNumber = await web3.eth.getBlockNumber()
            const confirmations = Number(latestBlockNumber - blockNumber)
            const amount = toCoinAmount(value, coin)
            const minConfirmations = Number(process.env.MIN_CONFIRMATIONS || 0)
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
            reject()
        }
    }

    reject()
}

module.exports = processDeposit
