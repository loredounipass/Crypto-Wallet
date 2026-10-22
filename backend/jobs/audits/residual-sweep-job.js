const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const { Queue } = require(`${appRoot}/config/bullmq`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const Erc20ForwardExecution = require(`${appRoot}/config/models/Erc20ForwardExecution`)
const { getTokenInfo } = require(`${appRoot}/config/tokens`)


// MINIMAL ERC20 ABI INTERFACES FOR BALANCE INQUIRY AND DECIMALS RESOLUTION
const erc20ABI = [
    {
        "inputs": [{"internalType": "address","name": "account","type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

const ERC20_ABI_DECIMALS = [
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "","type": "uint8"}],
        "type": "function"
    }
]


// MINIMUM TOKEN BALANCE THRESHOLD REQUIRED TO TRIGGER A RESIDUAL SWEEP
const SWEEP_THRESHOLD = 0.01


// SCANS ON-CHAIN TOKEN BALANCES ACROSS USER WALLETS AND ENQUEUES SWEEPS FOR ORPHAN RESIDUALS
const runResidualSweep = async ({ chainId, tokenAddress, rpcUrl }) => {
    // STEP 1: INITIALIZE WEB3 CONTRACT INSTANCE AND RESOLVE TOKEN DECIMALS AND DIVISOR
    const web3 = new Web3(rpcUrl)
    const tokenContract = new web3.eth.Contract(erc20ABI, tokenAddress)
    console.log(`[RESIDUAL-SWEEP] Running for ${chainId}:${tokenAddress}`)

    const tokenInfo = getTokenInfo(chainId, tokenAddress)
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
    const divisor = BigInt(10) ** BigInt(decimals)

    // STEP 2: LOAD ALL REGISTERED USER WALLETS ON TARGET CHAIN FOR AUDITING
    const wallets = await Wallet.find({ chainId })

    for (const wallet of wallets) {
        // STEP 3: QUERY ON-CHAIN BALANCE AND FORMAT TO HUMAN-READABLE UNIT AMOUNT
        const walletAddress = wallet.address

        const balanceStr = await tokenContract.methods.balanceOf(walletAddress).call()
        const balanceBig = BigInt(balanceStr)
        const whole = balanceBig / divisor
        const remainder = balanceBig % divisor
        const fractionalStr = remainder.toString().padStart(decimals, '0').slice(0, 8)
        const balanceDisplay = Number(whole.toString() + '.' + fractionalStr)

        // STEP 4: VERIFY IF ORPHAN BALANCE EXCEEDS THRESHOLD AND ENSURE NO IN-FLIGHT FORWARDS EXIST
        if (balanceDisplay > SWEEP_THRESHOLD) {
            const pendingExecs = await Erc20ForwardExecution.countDocuments({
                walletAddress,
                tokenAddress,
                chainId,
                settlement_state: { $in: ['PENDING_FORWARD', 'IN_FLIGHT'] }
            })

            // STEP 5: ENQUEUE DEDUPLICATED AGGREGATION JOB TO SWEEP ORPHAN TOKEN BALANCE
            if (pendingExecs === 0) {
                console.log(`[RESIDUAL-SWEEP] Orphan balance ${balanceDisplay} detected for ${walletAddress}. Forcing sweep.`)
                const aggregationQueue = new Queue('erc20-aggregation')
                await aggregationQueue.add('aggregate', {
                    walletAddress,
                    tokenAddress,
                    chainId,
                    trigger_event: 'residual_sweep'
                }, {
                    jobId: `residual-sweep-${chainId}-${tokenAddress}-${walletAddress}`.toLowerCase(),
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: { age: 86400, count: 500 },
                    removeOnFail: 50
                })
            }
        }
    }
}


// EXPORTS RESIDUAL SWEEP AUDITOR FOR SCHEDULED RECURRING CRON JOBS
module.exports = { runResidualSweep }
