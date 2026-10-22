const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const { connectAndSubscribeRealtime } = require('./erc20-realtime')


// PARSES TRACKED ERC20 TOKEN CONFIGURATIONS AND WEBSOCKET ENDPOINTS FROM ENVIRONMENT
function buildTokensFromEnv() {
    const tokens = []
    // STEP 1: PARSE TRACKED TOKENS SPECIFICATION FROM ENVIRONMENT
    const raw = process.env.ERC20_TRACKED_TOKENS
    if (!raw) return tokens

    // STEP 2: RESOLVE WEBSOCKET URL PER CHAIN AND ACCUMULATE SUBSCRIPTION CONFIGS
    for (const entry of raw.split(';')) {
        const parts = entry.split(',')
        if (parts.length >= 2) {
            const [chainId, tokenAddress] = parts
            const chainKey = getChainKey(Number(chainId))
            const wssUrl = process.env[`${chainKey}_WSS`]
            if (wssUrl) {
                tokens.push({ chainId: Number(chainId), tokenAddress: tokenAddress.toLowerCase(), wssUrl })
            } else {
                console.warn(`[ERC20-RUNNER] No WSS URL for chain ${chainId} (key ${chainKey}_WSS)`)
            }
        }
    }
    return tokens
}


// MAPS CHAIN ID TO CANONICAL ENVIRONMENT VARIABLE NETWORK KEY
function getChainKey(chainId) {
    const map = {
        11155111: 'ETHEREUM',
        137: 'POLYGON',
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


// INITIALIZES DATABASE CONNECTION AND BOOTSTRAPS REAL-TIME WEBSOCKET MONITORS
connectDB.then(() => {
    console.log('[ERC20-RUNNER] Conectado a la BD para iniciar suscripciones')

    // STEP 1: PARSE TRACKED TOKEN SUBSCRIPTION TARGETS FROM ENVIRONMENT
    const tokensToTrack = buildTokensFromEnv()
    console.log(`[ERC20-RUNNER] Tracked tokens configurados: ${tokensToTrack.length}`)

    if (tokensToTrack.length === 0) {
        console.warn('[ERC20-RUNNER] No ERC20_TRACKED_TOKENS env var found. Set e.g. ERC20_TRACKED_TOKENS="11155111,0xabc...;137,0xdef..."')
    }

    // STEP 2: INITIALIZE REAL-TIME WEBSOCKET SUBSCRIPTION FOR EACH MONITORED TOKEN
    tokensToTrack.forEach(config => {
        connectAndSubscribeRealtime(config).catch(err => {
            console.error(`[ERC20-RUNNER] Error fatal en suscripción para ${config.chainId}:${config.tokenAddress}`, err)
        })
    })
}).catch(err => {
    console.error('[ERC20-RUNNER] Error conectando a la BD:', err)
})
