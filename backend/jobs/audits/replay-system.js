// DETERMINISTIC ERC20 EVENT REPLAY SYSTEM
// RUN VIA CLI: node replay-system.js --chainId=56 --tokenAddress=0x... --fromBlock=0 --rpcUrl=... --execute
// DEFAULT MODE IS DRY-RUN (REPORT ONLY). SPECIFY --execute TO INGEST EVENTS INTO ORDERING ENGINE.
const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const OrderingEngine = require(`${appRoot}/config/utils/OrderingEngine`)


// REPLAYS ON-CHAIN ERC20 TRANSFER EVENTS DETERMINISTICALLY IN CHRONOLOGICAL SEQUENCE
const runDeterministicReplay = async (chainId, tokenAddress, fromBlock, rpcUrl, options = {}) => {
    const execute = options.execute === true
    console.log(`[REPLAY-SYSTEM] Initiating deterministic replay from block ${fromBlock} (execute=${execute})`)
    
    // STEP 1: QUERY ALL HISTORICAL TRANSFER LOGS LINEARLY FROM TARGET BLOCK TO LATEST
    const web3 = new Web3(rpcUrl)
    const topic = Web3.utils.sha3('Transfer(address,address,uint256)')
    
    const logs = await web3.eth.getPastLogs({
        fromBlock,
        toBlock: 'latest',
        address: tokenAddress,
        topics: [topic]
    })

    console.log(`[REPLAY-SYSTEM] Found ${logs.length} events. Ordering...`)

    // STEP 2: ORDER RETRIEVED LOGS STRICTLY BY BLOCK NUMBER AND LOG INDEX
    logs.sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
            return a.logIndex - b.logIndex
        }
        return a.blockNumber - b.blockNumber
    })

    // STEP 3: DECODE EVENT PARAMETERS (FROM, TO, VALUE) AND FORMAT LOG OBJECT
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

        // STEP 4: DISPATCH FORMATTED EVENT TO ORDERING ENGINE IF EXECUTION FLAG IS SET
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


// CLI ENTRYPOINT: PARSES COMMAND LINE ARGUMENTS AND INITIATES DETERMINISTIC REPLAY
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


// EXPORTS DETERMINISTIC REPLAY RUNNER FOR EXTERNAL AUTOMATION OR SCRIPT RUNNERS
module.exports = { runDeterministicReplay }
