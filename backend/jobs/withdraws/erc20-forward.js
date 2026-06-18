const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const Erc20ForwardExecution = require(`${appRoot}/config/models/Erc20ForwardExecution`)
const Erc20Ledger = require(`${appRoot}/config/models/Erc20Ledger`)
const TxManager = require(`${appRoot}/config/utils/TxManager`)
const { getTokenInfo } = require(`${appRoot}/config/tokens`)

const walletContractABI = [
    {
        "inputs": [{"internalType": "address","name": "tokenAddress","type": "address"}],
        "name": "forwardToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

const erc20ABI = [
    {
        "inputs": [{"internalType": "address","name": "account","type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY
const GAS_LIMIT_BUFFER = 1.2

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

const processForwardExecution = async (job) => {
    const { executionId } = job.data

    const execution = await Erc20ForwardExecution.findOne({ executionId })
    if (!execution || execution.settlement_state !== 'PENDING_FORWARD') {
        console.log(`[FORWARDER] Execution ${executionId} not found or not in PENDING_FORWARD state.`)
        return 'invalid_state'
    }

    const { chainId, walletAddress, tokenAddress, amount: amountStr } = execution
    const amountNum = Number(amountStr)

    const rpcUrl = require(`${appRoot}/config/chains/${chainId}`).rpc
    const web3 = new Web3(rpcUrl)

    const lockDoc = await Erc20ForwardExecution.findOneAndUpdate(
        { executionId, forwardLock: { $ne: true } },
        { $set: { forwardLock: true, forwardLockedAt: new Date() } }
    )
    if (!lockDoc) {
        console.log(`[FORWARDER] Another worker is processing forward for ${walletAddress}.`)
        throw new Error('Locked')
    }

    try {
        const account = web3.eth.accounts.privateKeyToAccount(RELAYER_PRIVATE_KEY)
        const relayerBalanceWei = await web3.eth.getBalance(account.address)
        const gasPrice = await web3.eth.getGasPrice()

        const walletContract = new web3.eth.Contract(walletContractABI, walletAddress)
        const txData = walletContract.methods.forwardToken(tokenAddress).encodeABI()

        let gasEstimate
        try {
            gasEstimate = await web3.eth.estimateGas({
                from: account.address,
                to: walletAddress,
                data: txData,
            })
        } catch (estimateErr) {
            console.warn(`[FORWARDER] Gas estimation failed, using fallback:`, estimateErr.message)
            gasEstimate = 150000
        }

        const gasLimit = Math.ceil(gasEstimate * GAS_LIMIT_BUFFER)
        const requiredWei = BigInt(gasLimit) * BigInt(gasPrice)

        if (BigInt(relayerBalanceWei) < requiredWei) {
            console.error(`[FORWARDER] Relayer ${account.address} has insufficient gas balance. ` +
                `Has: ${Web3.utils.fromWei(relayerBalanceWei, 'ether')}, ` +
                `Needs ~: ${Web3.utils.fromWei(requiredWei.toString(), 'ether')}`)
            execution.failure_type = 'NETWORK'
            execution.settlement_state = 'FAILED'
            await execution.save()
            throw new Error(`Insufficient relayer gas balance for ${walletAddress}`)
        }

        const tokenContract = new web3.eth.Contract(erc20ABI, tokenAddress)
        const onChainBalanceStr = await tokenContract.methods.balanceOf(walletAddress).call()
        const tokenInfo = getTokenInfo(tokenAddress)
        let decimals
        if (tokenInfo?.decimals != null) {
            decimals = tokenInfo.decimals
        } else {
            try {
                const decimalsContract = new web3.eth.Contract(ERC20_ABI_DECIMALS, tokenAddress)
                decimals = Number(await decimalsContract.methods.decimals().call())
            } catch {
                decimals = 18
            }
        }
        const onChainBalanceNum = toDisplayNumber(BigInt(onChainBalanceStr), decimals)

        if (onChainBalanceNum <= 0) {
            console.error(`[FORWARDER] Contract balance is 0 for ${walletAddress}. Skipping forward.`)
            execution.failure_type = 'REVERT'
            execution.settlement_state = 'FAILED'
            await execution.save()
            return 'empty_balance'
        }

        const RelayerLock = require(`${appRoot}/config/models/RelayerLock`)
        const relayerLock = await RelayerLock.findOneAndUpdate(
            { relayerAddress: account.address.toLowerCase(), chainId, lockActive: { $ne: true } },
            { $set: { lockActive: true, lockedAt: new Date() } },
            { upsert: true }
        )
        if (!relayerLock) {
            console.log(`[FORWARDER] Relayer ${account.address} nonce lock held by another worker. Retrying later.`)
            throw new Error('RelayerNonceLocked')
        }

        try {
            const nonce = await TxManager.getNonce(web3, account.address)

            execution.tx_state = 'QUEUED'
            execution.nonce = nonce
            await execution.save()

            const txObject = {
                from: account.address,
                to: walletAddress,
                nonce: web3.utils.toHex(nonce),
                gasPrice: web3.utils.toHex(gasPrice),
                gas: web3.utils.toHex(gasLimit),
                data: txData,
                chainId
            }

            execution.tx_state = 'BROADCASTED'
            execution.settlement_state = 'IN_FLIGHT'
            await execution.save()

            const signedTx = await web3.eth.accounts.signTransaction(txObject, RELAYER_PRIVATE_KEY)

            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

            execution.txHash = receipt.transactionHash
            execution.tx_state = 'MINED'
            execution.settlement_state = 'CONFIRMED'
            execution.failure_type = 'NONE'
            await execution.save()

            const updateResult = await Erc20Ledger.updateOne(
                { walletAddress, tokenAddress, chainId, locked_for_forward: { $gte: amountNum } },
                { $inc: { locked_for_forward: -amountNum, available_balance: -amountNum, forwarded_total: amountNum } }
            )

            if (updateResult.modifiedCount === 0) {
                console.error(`[FORWARDER] Ledger drift detected for ${walletAddress}: locked_for_forward < ${amountNum}. Manual reconciliation needed.`)
                execution.failure_type = 'LEDGER_DRIFT'
                await execution.save()
            }

            console.log(`[FORWARDER] Execution ${executionId} confirmed. Hash: ${receipt.transactionHash}`)
            return 'success'

        } catch (txError) {
            execution.failure_type = await TxManager.classifyFailure(txError)
            execution.tx_state = 'DROPPED'
            execution.settlement_state = 'FAILED'
            await execution.save()

            if (execution.failure_type === 'NONCE_COLLISION') {
                await TxManager.resetNonce(account.address)
            }

            console.error(`[FORWARDER] Tx failed:`, txError.message)
            throw txError
        } finally {
            await RelayerLock.updateOne(
                { relayerAddress: account.address.toLowerCase(), chainId },
                { $unset: { lockActive: '' } }
            ).catch(() => {})
        }

    } finally {
        await Erc20ForwardExecution.updateOne(
            { executionId },
            { $unset: { forwardLock: '', forwardLockedAt: '' } }
        )
    }
}

module.exports = processForwardExecution
