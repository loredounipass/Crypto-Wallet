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


// MODULE LEVEL WEB3 CLIENT INSTANCE
let web3


// STRING SANITIZATION AND BIGINT CONVERSION HELPERS
const ensureHexPrefix = (hexStr) => hexStr.startsWith('0x') ? hexStr : `0x${hexStr}`

const toSerializable = (value) => {
    if (typeof value === 'bigint') return Number(value)
    return value
}

const toWeiAmount = (amount, decimals) => {
    return parseUnits(String(amount), decimals)
}


// ATOMICALLY UPDATES TRANSACTION STATUS AND NOTIFIES WEBSOCKET CONSUMERS
const _updateTransactionState = async (txHash, status, transactionId, fee, enrichment = {}) => {
    const upsert = {
        status
    }

    if (txHash) {
        upsert.txHash = txHash
    }

    if (fee !== undefined)
        upsert.fee = fee

    await Transaction.updateOne({ _id: new ObjectId(transactionId) }, {
        $set: upsert
    })

    await publishTransactionStatusUpdate({
        transactionId: transactionId.toString(),
        status,
        nature: 2,
        txHash: txHash || enrichment.txHash,
        coin: enrichment.coin,
        chainId: enrichment.chainId,
        to: enrichment.to,
        amount: enrichment.amount,
        fee: fee ?? enrichment.fee ?? 0
    })
}


// ROLLS BACK FAILED WITHDRAWAL BY RESTORING WALLET BALANCE AND MARKING STATUS
const _rollbackOnFailure = async (transactionId, walletId, amount, errorMsg, enrichment = {}) => {
    console.error(`[WITHDRAW-TX] Rolling back failed withdrawal ${transactionId}:`, errorMsg)
    await Transaction.updateOne(
        { _id: new ObjectId(transactionId) },
        { $set: { status: 5 } }
    )
    
    await Wallet.updateOne(
        { _id: new ObjectId(walletId) },
        { $inc: { balance: amount } }
    )

    await publishTransactionStatusUpdate({
        transactionId: transactionId.toString(),
        status: 5,
        source: 'withdraw-rollback',
        nature: 2,
        amount: -1 * amount,
        coin: enrichment.coin,
        chainId: enrichment.chainId,
        to: enrichment.to,
        fee: 0
    })
}


// DETECTS EVM REVERT PATTERNS IN ERROR MESSAGES
const _isRevertError = (error) => {
    const msg = (error.message || '').toLowerCase()
    return msg.includes('revert') || msg.includes('execution reverted') || msg.includes('always failing transaction')
}


// BUILDS, SIGNS, AND BROADCASTS ON-CHAIN NATIVE TRANSFER FROM HOT WALLET
const sendTransaction = async (valueWei, toAddress, onTxHash = null) => {
    // STEP 1: INITIALIZE SENDER AND RECIPIENT CHECKSUM ADDRESSES AND FETCH GAS PRICE
    const fromAddress = web3.utils.toChecksumAddress(process.env.WITHDRAW_FROM_WALLET)
    const toChecksum = web3.utils.toChecksumAddress(toAddress)
    const valueStr = valueWei.toString()
    const gasPrice = BigInt(await web3.eth.getGasPrice())

    // STEP 2: ESTIMATE GAS LIMIT WITH SAFETY BUFFER OR APPLY FALLBACK
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

    // STEP 3: VERIFY SENDER HOT WALLET BALANCE AGAINST REQUIRED VALUE AND GAS
    const senderBalance = BigInt(await web3.eth.getBalance(fromAddress))
    const requiredBalance = valueWei + (gasPrice * gasLimit)

    if (senderBalance < requiredBalance) {
        throw new Error(`Insufficient hot wallet balance. required=${requiredBalance.toString()} available=${senderBalance.toString()}`)
    }

    // STEP 4: FETCH TARGET CHAIN ID AND RETRIEVE SEQUENTIAL NONCE VIA TX MANAGER
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

    // STEP 5: SIGN TRANSACTION WITH PRIVATE KEY AND INVOKE OPTIONAL ONTXHASH HOOK
    const signedTx = await web3.eth.accounts.signTransaction(
        transaction,
        ensureHexPrefix(process.env.WITHDRAW_FROM_PRIVATE_KEY)
    )

    if (onTxHash) {
        try {
            await onTxHash(signedTx.transactionHash)
        } catch (err) {
            console.error('[WITHDRAW-TX] Error in onTxHash callback:', err.message)
        }
    }

    // STEP 6: BROADCAST SIGNED TRANSACTION TO RPC NETWORK OR HANDLE COLLISION
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


// PROCESSES ON-CHAIN NATIVE AND ERC20 WITHDRAWAL AND UPDATES LEDGER STATE
const sendWithdraw = async ({
    walletId, transactionId, amount, withdrawAddress
}) => {
    // STEP 1: LOAD WALLET DOCUMENT AND RESOLVE COIN CONFIGURATION AND BALANCES
    const wallet = await Wallet.findOne({ _id: new ObjectId(walletId) },
        { transactions: 0 })

    if (wallet && 'coin' in wallet) {
        const { coin, chainId } = wallet
        try {
            const coinKey = String(coin).toUpperCase()
            const coinConfig = coins[coinKey]

            if (!coinConfig) {
                await _updateTransactionState(null, 4, transactionId, undefined, { coin, chainId, to: withdrawAddress, amount: -1 * amount })
                throw new Error(`Unsupported coin: ${coin} (normalized: ${coinKey})`)
            }

            // STEP 2: VALIDATE WITHDRAWAL AMOUNT EXCEEDS NETWORK FEE AND FETCH TRANSACTION RECORD
            const decimals = coinConfig.decimals
            const amountWei = toWeiAmount(amount, decimals)
            const feeWei = toWeiAmount(coinConfig.fee, decimals)
            const valueWei = amountWei - feeWei
            if (valueWei <= 0n) {
                await _updateTransactionState(null, 4, transactionId, undefined, { coin, chainId, to: withdrawAddress, amount: -1 * amount })
                throw new Error(`Invalid withdraw amount. amount must be greater than fee (${coinConfig.fee} ${coin})`)
            }
            const txRecord = await Transaction.findOne({ _id: new ObjectId(transactionId) })
            if (!txRecord) throw new Error('Transaction record not found')

            // STEP 3: INITIALIZE WEB3 PROVIDER FOR TARGET CHAIN
            web3 = new Web3(require(`${appRoot}/config/chains/` + chainId).rpc)
            
            let receipt;
            // STEP 4: RECOVER EXISTING PENDING TRANSACTION FROM ON-CHAIN RECEIPT OR MEMPOOL
            if (txRecord.txHash && txRecord.status === 1) {
                console.log(`[WITHDRAW-TX] Found pending txHash ${txRecord.txHash}. Checking status...`)
                try {
                    const chainReceipt = await web3.eth.getTransactionReceipt(txRecord.txHash)
                    if (chainReceipt) {
                        if (chainReceipt.status) {
                             receipt = { transactionHash: txRecord.txHash, status: true }
                        } else {
                             throw new Error(`Previous tx ${txRecord.txHash} failed on chain`)
                        }
                    } else {
                        // VERIFY WHETHER UNCONFIRMED TRANSACTION IS STILL PENDING IN MEMPOOL
                        const txInMempool = await web3.eth.getTransaction(txRecord.txHash).catch(() => null)
                        if (txInMempool) {
                            console.log(`[WITHDRAW-TX] TX ${txRecord.txHash} still in mempool. Waiting...`)
                            throw new Error('WAITING_FOR_CONFIRMATION')
                        }
                        // RESET TRANSACTION FOR RE-BROADCAST IF DISAPPEARED FROM BOTH CHAIN AND MEMPOOL
                        console.error(`[WITHDRAW-TX] TX ${txRecord.txHash} VANISHED. Not in mempool, no receipt. Resetting for re-broadcast.`)
                        await Transaction.updateOne(
                            { _id: new ObjectId(transactionId) },
                            { $set: { status: 0 }, $unset: { txHash: '' } }
                        )
                        throw new Error('TX_VANISHED_WILL_RETRY')
                    }
                } catch (e) {
                    if (e.message.includes('WAITING_FOR_CONFIRMATION') || e.message.includes('failed on chain') || e.message.includes('TX_VANISHED_WILL_RETRY')) {
                        throw e
                    }
                    // HANDLE UNEXPECTED RPC ERRORS AND ATTEMPT SECONDARY MEMPOOL VERIFICATION
                    console.warn(`[WITHDRAW-TX] Error checking receipt for ${txRecord.txHash}:`, e.message)
                    const isNotFound = e.message.toLowerCase().includes('not found') || e.message.toLowerCase().includes('unknown transaction')
                    if (isNotFound) {
                        const txInMempool = await web3.eth.getTransaction(txRecord.txHash).catch(() => null)
                        if (!txInMempool) {
                            console.error(`[WITHDRAW-TX] TX ${txRecord.txHash} confirmed vanished (RPC error + not in mempool). Resetting for re-broadcast.`)
                            await Transaction.updateOne(
                                { _id: new ObjectId(transactionId) },
                                { $set: { status: 0 }, $unset: { txHash: '' } }
                            )
                            throw new Error('TX_VANISHED_WILL_RETRY')
                        }
                    }
                    throw new Error('WAITING_FOR_CONFIRMATION')
                }
            } else if (txRecord.status === 2) {
                console.log(`[WITHDRAW-TX] Transaction ${transactionId} already completed, skipping`)
                return 'success'
            } else {
                // STEP 5: BROADCAST NEW WITHDRAWAL TRANSACTION AND PRE-SAVE PENDING STATUS
                const onTxHash = async (hash) => {
                    console.log(`[WITHDRAW-TX] Pre-saving txHash ${hash} to prevent duplicate retries`)
                    await _updateTransactionState(hash, 1, transactionId, undefined, { coin, chainId, to: withdrawAddress, amount: -1 * amount })
                }
                receipt = await sendTransaction(valueWei, withdrawAddress, onTxHash)
            }

            // STEP 6: FINALIZE TRANSACTION RECORD AND HANDLE COMPOUND INDEX TXHASH COLLISIONS
            if (receipt) {
                const { transactionHash, status } = receipt
                
                try {
                    await _updateTransactionState(transactionHash, status ? 2 : 4, transactionId, coinConfig.fee, { coin, chainId, to: withdrawAddress, amount: -1 * amount })
                } catch (err) {
                    if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
                        console.warn('[WITHDRAW-TX] txHash collision with deposit, linking transactions', {
                            transactionId,
                            transactionHash
                        })
                        // AVOID DUPLICATE KEY CONFLICT BY ATTACHING REFERENCE VIA LINKEDTXHASH
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

                // STEP 7: ENQUEUE WITHDRAWAL NOTIFICATION EVENT IN BULLMQ WITHDRAWEDFROMMETADAPP
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
            // STEP 8: RETAIN PENDING STATUS ON TIMEOUTS OR PROPAGATE FAILURE FOR WORKER RETRY
            if (err.message && !err.message.includes('Unsupported coin')) {
                 if (err.message.includes('was not mined within 50 blocks') || err.message.includes('might still be mined') || err.message.includes('WAITING_FOR_CONFIRMATION') || err.message.includes('TX_VANISHED_WILL_RETRY')) {
                     console.warn(`[WITHDRAW-TX] Timeout or pending detected for ${transactionId}. Leaving transaction as pending. DO NOT ROLLBACK.`)
                 } else {
                     console.error(`[WITHDRAW-TX] Transaction failed, will retry: ${err.message}`)
                 }
            }
            throw err;
        }
    }

    throw 'error: not processed'
}


// EXPORTS WITHDRAWAL DISPATCH HANDLER FOR QUEUE CONSUMERS
module.exports = sendWithdraw
