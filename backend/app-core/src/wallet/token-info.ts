export interface TokenInfo {
    symbol: string;
    decimals: number;
    coinGeckoId: string;
}

// Re-export from shared config so both daemon and API use the same source of truth
const tokens: Record<string, TokenInfo> = {
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
};

export function getTokenInfo(tokenAddress: string): TokenInfo | null {
    return tokens[tokenAddress.toLowerCase()] || null;
}
