const appRoot = require('app-root-path')
const ObjectId = require('mongoose').Types.ObjectId
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const User = require(`${appRoot}/config/models/User`)
const coins = require(`${appRoot}/config/coins/info`)
const { Web3 } = require('web3')
const { sendWithdrawEmail } = require('../notifications/mailService')

let web3

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

const reject = () => {
    throw 'error: not withdrawed'
}

const _updateTransactionState = async (tId, status, confirmations) => {
    const upsert = {
        status
    }

    if (confirmations !== undefined && confirmations !== null)
        upsert.confirmations = confirmations

    await Transaction.updateOne({ _id: ObjectId(tId) }, {
        $set: upsert
    })
}

const _checkConfirmation = async (address, txHash, value, coin, chainId, transactionId) => {
    var result = await web3.eth.getTransactionReceipt(txHash)
    if (result && 'status' in result && result.status) {
        await _updateTransactionState(transactionId, 3)
        const wallet = await Wallet.findOne({ transactions: ObjectId(transactionId) })
        if (wallet) {
            const user = await User.findOne({ wallets: ObjectId(wallet._id) })
            if (user && user.email) {
                sendWithdrawEmail(toCoinAmount(value, coin), coin, address, txHash, user.email)
            }
        }
        return 'withdrawed'
    }

    reject()
}

const processWithdraw = async ({
    walletAddress, transactionHash, transactionId, chainId, coin
}) => {
    web3 = new Web3(require(`${appRoot}/config/chains/` + chainId).rpc)
    var result = await Transaction.findOne({ _id: ObjectId(transactionId) })
    if (result) {
        result = await web3.eth.getTransaction(transactionHash)
        if (result && 'value' in result) {
            const { value, blockNumber } = result
            const latestBlockNumber = await web3.eth.getBlockNumber()
            const confirmations = Number(latestBlockNumber - blockNumber)
            const minConfirmations = Number(process.env.MIN_CONFIRMATIONS || 0)
            await _updateTransactionState(transactionId, 2, confirmations)
            if (confirmations >= minConfirmations) {
                return await _checkConfirmation(
                    walletAddress, transactionHash, value, coin, chainId, transactionId
                )
            }

            reject()
        }
    }

    reject()
}

module.exports = processWithdraw
