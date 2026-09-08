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

    if (txHash) {
        // Find existing to avoid overwriting linkedTxHash if it exists, or just use $set
        // We handle the duplicate key error in the caller
        upsert.txHash = txHash
    }

    if (fee !== undefined)
        upsert.fee = fee

    await Transaction.updateOne({ _id: new ObjectId(transactionId) }, {
        $set: upsert
    })

    await publishTransactionStatusUpdate({
        transactionId: transactionId.toString(),
        status
    })
}

const _rollbackOnFailure = async (transactionId, walletId, amount, errorMsg) => {
    console.error(`[WITHDRAW-TX] Rolling back failed withdrawal ${transactionId}:`, errorMsg)
    // Status 5: Broadcast Failed
    await Transaction.updateOne(
        { _id: new ObjectId(transactionId) },
        { $set: { status: 5 } }
    )
    
    // Restore balance
    await Wallet.updateOne(
        { _id: new ObjectId(walletId) },
        { $inc: { balance: amount } }
    )

    await publishTransactionStatusUpdate({
        transactionId: transactionId.toString(),
        status: 5,
        source: 'withdraw-rollback'
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
        try {
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
            
            try {
                await _updateTransactionState(transactionHash, status ? 2 : 4, transactionId, coinConfig.fee)
            } catch (err) {
                if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
                    console.warn('[WITHDRAW-TX] txHash collision with deposit, linking transactions', {
                        transactionId,
                        transactionHash
                    })
                    // Deposit subscription already created a Transaction with this txHash.
                    // Update our withdraw Transaction without txHash, link via reference field
                    await Transaction.updateOne(
                        { _id: new ObjectId(transactionId) },
                        { $set: { 
                            status: status ? 2 : 4, 
                            fee: coinConfig.fee,
                            linkedTxHash: transactionHash
                        }}
                    )
                } else {
                    throw err
                }
            }

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
    } catch (err) {
        // Rollback the balance if something went wrong before or during the transaction
        if (err.message && !err.message.includes('Unsupported coin')) {
             await _rollbackOnFailure(transactionId, walletId, amount, err.message)
        }
        throw err;
    }
    } // Closes if (wallet && 'coin' in wallet)

    throw 'error: not processed'
}

module.exports = sendWithdraw
