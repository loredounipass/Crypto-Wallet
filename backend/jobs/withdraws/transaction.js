const appRoot = require('app-root-path')
const ObjectId = require('mongoose').Types.ObjectId
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const coins = require(`${appRoot}/config/coins/info`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const { Web3 } = require('web3')
const { parseUnits } = require('ethers')

let web3

const toSerializable = (value) => {
    if (typeof value === 'bigint') return Number(value)
    return value
}

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}

const _updateTransactionState = async (txHash, status, transactionId) => {
    const upsert = {
        status
    }

    if (txHash)
        upsert.txHash = txHash

    await Transaction.updateOne({ _id: ObjectId(transactionId) }, {
        $set: upsert
    })
}

const sendTransaction = async (valueWei, toAddress) => {
    const fromAddress = web3.utils.toChecksumAddress(process.env.WITHDRAW_FROM_WALLET)
    const toChecksum = web3.utils.toChecksumAddress(toAddress)
    const valueHex = web3.utils.toHex(valueWei.toString())
    const gasPrice = BigInt(await web3.eth.getGasPrice())
    const gasLimit = BigInt(await web3.eth.estimateGas({
        from: fromAddress,
        to: toChecksum,
        value: valueHex
    }))
    const senderBalance = BigInt(await web3.eth.getBalance(fromAddress))
    const requiredBalance = valueWei + (gasPrice * gasLimit)

    if (senderBalance < requiredBalance) {
        throw new Error(`Insufficient hot wallet balance. required=${requiredBalance.toString()} available=${senderBalance.toString()}`)
    }

    const nonce = await web3.eth.getTransactionCount(fromAddress, 'pending')
    const chainId = await web3.eth.getChainId()
    const transaction = {
        from: fromAddress,
        chainId,
        nonce: web3.utils.toHex(nonce),
        gasPrice: web3.utils.toHex(gasPrice.toString()),
        gas: web3.utils.toHex(gasLimit.toString()),
        to: toChecksum,
        value: valueHex
    }

    const signedTx = await web3.eth.accounts.signTransaction(
        transaction,
        process.env.WITHDRAW_FROM_PRIVATE_KEY
    )

    try {
        return await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    } catch (error) {
        const errorMessage = error?.message || 'unknown sendSignedTransaction error'
        throw new Error(`Withdraw tx failed: ${errorMessage}`)
    }
}

const sendWithdraw = async ({
    walletId, transactionId, amount, withdrawAddress
}) => {
    const wallet = await Wallet.findOne({ _id: ObjectId(walletId) },
        { transactions: 0 })

    if (wallet && 'coin' in wallet) {
        const { coin, chainId } = wallet
        const decimals = coins[coin].decimals
        const amountWei = toWeiAmount(amount, decimals)
        const feeWei = toWeiAmount(coins[coin].fee, decimals)
        const valueWei = amountWei - feeWei
        if (valueWei <= 0n) {
            await _updateTransactionState(null, 4, transactionId)
            throw new Error(`Invalid withdraw amount. amount must be greater than fee (${coins[coin].fee} ${coin})`)
        }
        web3 = new Web3(require(`${appRoot}/config/chains/` + chainId).rpc)
        const receipt = await sendTransaction(valueWei, withdrawAddress)
        if (receipt) {
            const { transactionHash, status } = receipt
            await _updateTransactionState(transactionHash, status ? 2 : 4, transactionId)

            const withdrawFrom = new Queue('WithdrawedFromMetaDapp')
            withdrawFrom.add('withdraw', {
                chainId: toSerializable(chainId),
                amount: toSerializable(amount),
                withdrawAddress,
                transactionHash,
                transactionId,
                status: toSerializable(status),
                coin: wallet.coin
            })

            return 'success'
        }
    }

    throw 'error: not processed'
}

module.exports = sendWithdraw
