const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const { Queue } = require(`${appRoot}/config/bullmq`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const Erc20ForwardExecution = require(`${appRoot}/config/models/Erc20ForwardExecution`)
const { getTokenInfo } = require(`${appRoot}/config/tokens`)

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

const SWEEP_THRESHOLD = 0.01

const runResidualSweep = async ({ chainId, tokenAddress, rpcUrl }) => {
    const web3 = new Web3(rpcUrl)
    const tokenContract = new web3.eth.Contract(erc20ABI, tokenAddress)
    console.log(`[RESIDUAL-SWEEP] Running for ${chainId}:${tokenAddress}`)

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
    const divisor = BigInt(10) ** BigInt(decimals)

    const wallets = await Wallet.find({ chainId })

    for (const wallet of wallets) {
        const walletAddress = wallet.address

        const balanceStr = await tokenContract.methods.balanceOf(walletAddress).call()
        const balanceBig = BigInt(balanceStr)
        const whole = balanceBig / divisor
        const remainder = balanceBig % divisor
        const fractionalStr = remainder.toString().padStart(decimals, '0').slice(0, 8)
        const balanceDisplay = Number(whole.toString() + '.' + fractionalStr)

        if (balanceDisplay > SWEEP_THRESHOLD) {
            const pendingExecs = await Erc20ForwardExecution.countDocuments({
                walletAddress,
                tokenAddress,
                chainId,
                settlement_state: { $in: ['PENDING_FORWARD', 'IN_FLIGHT'] }
            })

            if (pendingExecs === 0) {
                console.log(`[RESIDUAL-SWEEP] Orphan balance ${balanceDisplay} detected for ${walletAddress}. Forcing sweep.`)
                const aggregationQueue = new Queue('erc20-aggregation')
                await aggregationQueue.add('aggregate', {
                    walletAddress,
                    tokenAddress,
                    chainId,
                    trigger_event: 'residual_sweep'
                })
            }
        }
    }
}

module.exports = { runResidualSweep }
