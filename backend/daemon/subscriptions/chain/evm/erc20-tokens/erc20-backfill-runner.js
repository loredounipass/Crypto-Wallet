const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { runBackfill } = require(`${appRoot}/jobs/indexers/erc20-backfill`)


// RUNNER POLLING INTERVAL IN MILLISECONDS
const POLL_INTERVAL_MS = Number(process.env.ERC20_BACKFILL_POLL_INTERVAL_MS || 300000)


// PARSES TRACKED ERC20 TOKEN ADDRESSES AND RPCS FROM ENVIRONMENT VARIABLES
function buildTokensFromEnv() {
    const tokens = []
    // STEP 1: PARSE TRACKED TOKENS SPECIFICATION FROM ENVIRONMENT
    const raw = process.env.ERC20_TRACKED_TOKENS
    if (!raw) return tokens

    // STEP 2: LOAD CHAIN RPC CONFIGURATION AND ACCUMULATE ACTIVE TOKEN TUPLES
    for (const entry of raw.split(';')) {
        const parts = entry.split(',')
        if (parts.length >= 2) {
            const [chainId, tokenAddress] = parts
            const chainConfig = require(`${appRoot}/config/chains/${Number(chainId)}`)
            const rpcUrl = chainConfig.rpc
            if (rpcUrl) {
                tokens.push({ chainId: Number(chainId), tokenAddress: tokenAddress.toLowerCase(), rpcUrl })
            } else {
                console.warn(`[ERC20-BACKFILL-RUNNER] No RPC URL for chain ${chainId}`)
            }
        }
    }
    return tokens
}


// SEQUENTIALLY EXECUTES BACKFILL INDEXER FOR ALL MONITORED ERC20 TOKENS
async function runAllBackfills(tokens) {
    // STEP 1: ITERATE TRACKED TOKEN CONFIGURATIONS AND TRIGGER BACKFILL PROCESSOR
    for (const config of tokens) {
        try {
            await runBackfill(config)
        } catch (err) {
            console.error(`[ERC20-BACKFILL-RUNNER] Backfill error for ${config.chainId}:${config.tokenAddress}:`, err.message || err)
        }
    }
}


// INITIALIZES DATABASE CONNECTION AND STARTS RECURRING BACKFILL DAEMON
connectDB.then(async () => {
    console.log('[ERC20-BACKFILL-RUNNER] Conectado a MongoDB')

    // STEP 1: PARSE MONITORED TOKEN CONFIGURATIONS
    const tokens = buildTokensFromEnv()
    console.log(`[ERC20-BACKFILL-RUNNER] Tracked tokens: ${tokens.length}`)

    if (tokens.length === 0) {
        console.warn('[ERC20-BACKFILL-RUNNER] No ERC20_TRACKED_TOKENS env var found. Nothing to backfill.')
        return
    }

    // STEP 2: LAUNCH CONTINUOUS POLLING CYCLE WITH CONFIGURED DELAY
    const poll = async () => {
        console.log('[ERC20-BACKFILL-RUNNER] Starting backfill cycle...')
        await runAllBackfills(tokens)
        console.log(`[ERC20-BACKFILL-RUNNER] Cycle complete. Next poll in ${POLL_INTERVAL_MS}ms`)
        setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
}).catch(err => {
    console.error('[ERC20-BACKFILL-RUNNER] Error conectando a BD:', err)
})
