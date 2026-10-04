/**
 * Deterministic Replay System
 * Run via CLI: node replay-system.js --chainId=56 --tokenAddress=0x... --fromBlock=0 --rpcUrl=... --execute
 *
 * Por defecto es DRY-RUN (solo reporta, no escribe a colas). Para reinyectar
 * eventos reales se exige el flag --execute. Sin esta compuerta, correr el
 * replay duplica el encolado y amplifica cualquier ventana de carrera aguas abajo.
 */
const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const OrderingEngine = require(`${appRoot}/config/utils/OrderingEngine`)

// In a real environment, this would spin up an isolated DB or operate in a 'Dry-Run' shadow collection
const runDeterministicReplay = async (chainId, tokenAddress, fromBlock, rpcUrl, options = {}) => {
    const execute = options.execute === true
    console.log(`[REPLAY-SYSTEM] Initiating deterministic replay from block ${fromBlock} (execute=${execute})`)
    
    // 1. Fetch ALL past events linearly
    const web3 = new Web3(rpcUrl)
    const topic = Web3.utils.sha3('Transfer(address,address,uint256)')
    
    const logs = await web3.eth.getPastLogs({
        fromBlock,
        toBlock: 'latest',
        address: tokenAddress,
        topics: [topic]
    })

    console.log(`[REPLAY-SYSTEM] Found ${logs.length} events. Ordering...`)

    // Sort strictly by blockNumber, then logIndex
    logs.sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
            return a.logIndex - b.logIndex
        }
        return a.blockNumber - b.blockNumber
    })

    // Replay logic (mocked for dry-run)
    for (const result of logs) {
        const fromAddress = web3.eth.abi.decodeParameter('address', result.topics[1]).toLowerCase()
        const toAddress = web3.eth.abi.decodeParameter('address', result.topics[2]).toLowerCase()
        const value = web3.eth.abi.decodeParameter('uint256', result.data)

        const eventFormatted = {
            transactionHash: result.transactionHash,
            logIndex: Number(result.logIndex),
            blockNumber: Number(result.blockNumber),
            returnValues: { from: fromAddress, to: toAddress, value }
        }

        console.log(`[REPLAY-SYSTEM] Ingesting event at block ${result.blockNumber}, logIndex ${result.logIndex}...`)

        if (!execute) {
            continue
        }
        await OrderingEngine.ingestEvent({
            chainId,
            tokenAddress,
            event: eventFormatted
        })
    }

    console.log(`[REPLAY-SYSTEM] Replay ${execute ? 'completed (events ingested)' : 'completed (DRY-RUN, no events ingested)'}.`)
}

if (require.main === module) {
    const args = Object.fromEntries(
        process.argv.slice(2).map(a => {
            const [k, v] = a.replace(/^--/, '').split('=')
            return [k, v === undefined ? true : v]
        })
    )
    if (!args.chainId || !args.tokenAddress || !args.fromBlock || !args.rpcUrl) {
        console.error('Usage: node replay-system.js --chainId=56 --tokenAddress=0x... --fromBlock=0 --rpcUrl=... [--execute]')
        process.exit(1)
    }
    runDeterministicReplay(Number(args.chainId), String(args.tokenAddress), Number(args.fromBlock), String(args.rpcUrl), { execute: args.execute === true || args.execute === 'true' })
        .then(() => process.exit(0))
        .catch((err) => { console.error('[REPLAY-SYSTEM]', err.message); process.exit(1) })
}

module.exports = { runDeterministicReplay }
