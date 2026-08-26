const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { runBackfill } = require(`${appRoot}/jobs/indexers/erc20-backfill`)

const POLL_INTERVAL_MS = Number(process.env.ERC20_BACKFILL_POLL_INTERVAL_MS || 300000)

function getChainKey(chainId) {
    const map = {
        11155111: 'ETHEREUM',
        137: 'POLYGON',
        80001: 'POLYGON',
        80002: 'POLYGON',
        56: 'BSC',
        97: 'BSC',
        43113: 'AVALANCHE',
        43114: 'AVALANCHE',
        10: 'OPTIMISM',
        11155420: 'OPTIMISM',
        250: 'SONIC',
        14601: 'SONIC'
    }
    return map[chainId] || 'ETHEREUM'
}

function buildTokensFromEnv() {
    const tokens = []
    const raw = process.env.ERC20_TRACKED_TOKENS
    if (!raw) return tokens

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

async function runAllBackfills(tokens) {
    for (const config of tokens) {
        try {
            await runBackfill(config)
        } catch (err) {
            console.error(`[ERC20-BACKFILL-RUNNER] Backfill error for ${config.chainId}:${config.tokenAddress}:`, err.message || err)
        }
    }
}

connectDB.then(async () => {
    console.log('[ERC20-BACKFILL-RUNNER] Conectado a MongoDB')

    const tokens = buildTokensFromEnv()
    console.log(`[ERC20-BACKFILL-RUNNER] Tracked tokens: ${tokens.length}`)

    if (tokens.length === 0) {
        console.warn('[ERC20-BACKFILL-RUNNER] No ERC20_TRACKED_TOKENS env var found. Nothing to backfill.')
        return
    }

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
