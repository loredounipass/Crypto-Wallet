// Mapa de tokenAddress (lowercase) → { symbol, decimals, coinGeckoId }
// Usado tanto por daemon workers como por app-core API
const TOKEN_MAP = {
    '0xdac17f958d2ee523a2206206994597c13d831ec7': {
        symbol: 'USDT',
        decimals: 6,
        coinGeckoId: 'tether',
    },
    '0x543c4eeb75cf5d88171a8edb36e9c8562dadc864': {
        symbol: 'mUSDT',
        decimals: 6,
        coinGeckoId: null,
    },
}

function getTokenInfo(tokenAddress) {
    return TOKEN_MAP[tokenAddress.toLowerCase()] || null
}

module.exports = { getTokenInfo, TOKEN_MAP }
