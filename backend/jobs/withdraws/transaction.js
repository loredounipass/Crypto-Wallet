const appRoot = require('app-root-path')
const ObjectId = require('mongoose').Types.ObjectId
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const coins = require(`${appRoot}/config/coins/info`)
const { Queue } = require(`${appRoot}/config/bullmq`)
const { Web3 } = require('web3')
const { parseUnits } = require('ethers')
const TxManager = require(`${appRoot}/config/utils/TxManager`)
const { publishTransactionStatusUpdate } = require('../notifications/transactionStatusQueue')

let web3

const toSerializable = (value) => {
    if (typeof value === 'bigint') return Number(value)
    return value
}

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}

const _updateTransactionState = async (txHash, status, transactionId, fee) => {
    const upsert = {
        status
    }

    if (txHash)
        upsert.txHash = txHash
    
    if (fee !== undefined)
        upsert.fee = fee

    try {
        await Transaction.updateOne({ _id: new ObjectId(transactionId) }, {
            $set: upsert
        })
    } catch (error) {
        if (error?.code !== 11000 || !txHash) throw error

        const existing = await Transaction.findOne({
            txHash: String(txHash).toLowerCase()
        }, { _id: 1, nature: 1, status: 1 })

        if (!existing || existing.nature !== 1) throw error

        console.warn('[WITHDRAW-TX] Hash already tracked, preserving the existing hash record and updating the withdrawal:', {
            txHash,
            existingTransactionId: existing._id.toString(),
            withdrawalTransactionId: transactionId.toString()
        })

        const withdrawalUpdate = { status }
        if (fee !== undefined) withdrawalUpdate.fee = fee

        await Transaction.updateOne(
            { _id: new ObjectId(transactionId) },
            { $set: withdrawalUpdate }
        )
    }

    await publishTransactionStatusUpdate({
        transactionId: transactionId.toString(),
        status
    })
}

const _isRevertError = (error) => {
    const msg = (error.message || '').toLowerCase()
    return msg.includes('revert') || msg.includes('execution reverted') || msg.includes('always failing transaction')
}

const sendTransaction = async (valueWei, toAddress) => {
    const fromAddress = web3.utils.toChecksumAddress(process.env.WITHDRAW_FROM_WALLET)
    const toChecksum = web3.utils.toChecksumAddress(toAddress)
    const valueStr = valueWei.toString()
    const gasPrice = BigInt(await web3.eth.getGasPrice())

    let gasLimit
    try {
        gasLimit = BigInt(await web3.eth.estimateGas({
            from: fromAddress,
            to: toChecksum,
            value: valueStr
        }))
        gasLimit = gasLimit * 120n / 100n
    } catch (estimateError) {
        if (_isRevertError(estimateError)) {
            throw new Error(`[WITHDRAW-TX] Native transfer would revert: ${estimateError.message}`)
        }
        console.warn('[WITHDRAW-TX] Gas estimation failed, using default:', estimateError.message)
        gasLimit = 30000n
    }

    const senderBalance = BigInt(await web3.eth.getBalance(fromAddress))
    const requiredBalance = valueWei + (gasPrice * gasLimit)

    if (senderBalance < requiredBalance) {
        throw new Error(`Insufficient hot wallet balance. required=${requiredBalance.toString()} available=${senderBalance.toString()}`)
    }

    const chainId = await web3.eth.getChainId()
    const nonce = await TxManager.getNonce(web3, fromAddress, Number(chainId))
    const transaction = {
        from: fromAddress,
        chainId,
        nonce: web3.utils.toHex(nonce),
        gasPrice: gasPrice.toString(),
        gas: gasLimit.toString(),
        to: toChecksum,
        value: valueStr
    }

    const signedTx = await web3.eth.accounts.signTransaction(
        transaction,
        process.env.WITHDRAW_FROM_PRIVATE_KEY
    )

    try {
        return await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    } catch (error) {
        const failureType = await TxManager.classifyFailure(error)
        if (failureType === 'NONCE_COLLISION') {
            await TxManager.resetNonce(fromAddress, Number(chainId))
        }
        const errorMessage = error?.message || 'unknown sendSignedTransaction error'
        throw new Error(`Withdraw tx failed: ${errorMessage}`)
    }
}

const sendWithdraw = async ({
    walletId, transactionId, amount, withdrawAddress
}) => {
    const wallet = await Wallet.findOne({ _id: new ObjectId(walletId) },
        { transactions: 0 })

    if (wallet && 'coin' in wallet) {
        const { coin, chainId } = wallet
        const coinKey = String(coin).toUpperCase()
        const coinConfig = coins[coinKey]

        if (!coinConfig) {
            await _updateTransactionState(null, 4, transactionId)
            throw new Error(`Unsupported coin: ${coin} (normalized: ${coinKey})`)
        }

        const decimals = coinConfig.decimals
        const amountWei = toWeiAmount(amount, decimals)
        const feeWei = toWeiAmount(coinConfig.fee, decimals)
        const valueWei = amountWei - feeWei
        if (valueWei <= 0n) {
            await _updateTransactionState(null, 4, transactionId)
            throw new Error(`Invalid withdraw amount. amount must be greater than fee (${coinConfig.fee} ${coin})`)
        }
        web3 = new Web3(require(`${appRoot}/config/chains/` + chainId).rpc)
        const receipt = await sendTransaction(valueWei, withdrawAddress)
        if (receipt) {
            const { transactionHash, status } = receipt
            await _updateTransactionState(transactionHash, status ? 2 : 4, transactionId, coinConfig.fee)

            const withdrawFrom = new Queue('WithdrawedFromMetaDapp')
            withdrawFrom.add('withdraw', {
                chainId: toSerializable(chainId),
                amount: toSerializable(amount),
                withdrawAddress,
                transactionHash,
                transactionId,
                status: toSerializable(status),
                coin: wallet.coin
            }, {
                removeOnComplete: true,
                removeOnFail: 50
            })

            return 'success'
        }
    }

    throw 'error: not processed'
}

module.exports = sendWithdraw
