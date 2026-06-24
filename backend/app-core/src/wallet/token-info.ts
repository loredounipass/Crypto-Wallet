export interface TokenInfo {
    symbol: string;
    decimals: number;
    coinGeckoId: string;
}

// Default token registry — can be extended via SUPPORTED_TOKEN_ADDRESSES env var.
const DEFAULT_TOKENS: Record<string, TokenInfo> = {};

/**
 * Build token map from environment variable (JSON) with defaults fallback.
 * Env format: SUPPORTED_TOKEN_ADDRESSES='{"0xaddr":{"symbol":"X","decimals":18,"coinGeckoId":"x"}}'
 */
function buildTokenMap(): Record<string, TokenInfo> {
    const envTokens = process.env.SUPPORTED_TOKEN_ADDRESSES;
    if (envTokens) {
        try {
            const parsed = JSON.parse(envTokens) as Record<string, TokenInfo>;
            return { ...DEFAULT_TOKENS, ...parsed };
        } catch {
            // Invalid JSON — fall back to defaults
        }
    }
    return { ...DEFAULT_TOKENS };
}

const tokens: Record<string, TokenInfo> = buildTokenMap();

export function getTokenInfo(tokenAddress: string): TokenInfo | null {
    return tokens[tokenAddress.toLowerCase()] || null;
}
