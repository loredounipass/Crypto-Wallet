const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const mongoose = require('mongoose')
const { connectAndSubscribeRealtime } = require('./erc20-realtime')

const DB_URI = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`

function buildTokensFromEnv() {
    const tokens = []
    const raw = process.env.ERC20_TRACKED_TOKENS
    if (!raw) return tokens

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

function getChainKey(chainId) {
    const map = {
        11155111: 'ETHEREUM',
        137: 'POLYGON',
        80001: 'POLYGON',
        56: 'BSC',
        97: 'BSC',
        43113: 'AVALANCHE',
        43114: 'AVALANCHE',
        10: 'OPTIMISM',
        11155420: 'OPTIMISM',
        250: 'FANTOM',
        4002: 'FANTOM'
    }
    return map[chainId] || 'ETHEREUM'
}

mongoose.connect(DB_URI).then(() => {
    console.log('[ERC20-RUNNER] Conectado a la BD para iniciar suscripciones')

    const tokensToTrack = buildTokensFromEnv()
    console.log(`[ERC20-RUNNER] Tracked tokens configurados: ${tokensToTrack.length}`)

    if (tokensToTrack.length === 0) {
        console.warn('[ERC20-RUNNER] No ERC20_TRACKED_TOKENS env var found. Set e.g. ERC20_TRACKED_TOKENS="11155111,0xabc...;137,0xdef..."')
    }

    tokensToTrack.forEach(config => {
        connectAndSubscribeRealtime(config).catch(err => {
            console.error(`[ERC20-RUNNER] Error fatal en suscripción para ${config.chainId}:${config.tokenAddress}`, err)
        })
    })
}).catch(err => {
    console.error('[ERC20-RUNNER] Error conectando a la BD:', err)
})
