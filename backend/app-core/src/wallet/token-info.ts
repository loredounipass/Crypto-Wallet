export interface TokenInfo {
    symbol: string;
    decimals: number;
    coinGeckoId: string;
}

type ChainTokenMap = Record<string, Record<string, TokenInfo>>;

const DEFAULT_TOKENS: ChainTokenMap = {};



// LEE LA VARIABLE DE ENTORNO PARA CONSTRUIR UN MAPA DE TOKENS SOPORTADOS RETORNANDO EL OBJETO CONFIGURADO O POR DEFECTO
function buildTokenMap(): ChainTokenMap {
    const envTokens = process.env.SUPPORTED_TOKEN_ADDRESSES;
    if (envTokens) {
        try {
            const parsed = JSON.parse(envTokens) as ChainTokenMap;
            // Merge env tokens into default tokens per chain
            const merged: ChainTokenMap = { ...DEFAULT_TOKENS };
            for (const [chainId, tokens] of Object.entries(parsed)) {
                merged[chainId] = { ...(merged[chainId] || {}), ...tokens };
            }
            return merged;
        } catch {
        }
    }
    return { ...DEFAULT_TOKENS };
}

const tokens: ChainTokenMap = buildTokenMap();



// RECUPERA Y DEVUELVE LA INFORMACION DETALLADA DEL TOKEN CONSULTANDO EL MAPA CON CHAIN ID Y DIRECCION EN MINUSCULAS
// Firma principal: getTokenInfo(chainId, tokenAddress) → lookup directo O(1)
// Firma legacy:    getTokenInfo(tokenAddress) → búsqueda lineal en todos los chains (backward compat)
export function getTokenInfo(chainIdOrAddress: string | number, tokenAddress?: string): TokenInfo | null {
    // --- Backward compatibility: si solo se pasa 1 argumento, es la firma vieja ---
    if (tokenAddress === undefined) {
        const addr = String(chainIdOrAddress).toLowerCase();
        for (const chainTokens of Object.values(tokens)) {
            if (chainTokens[addr]) return chainTokens[addr];
        }
        return null;
    }

    // --- Firma nueva: getTokenInfo(chainId, tokenAddress) ---
    const chainKey = String(chainIdOrAddress);
    const addr = tokenAddress.toLowerCase();

    const chainTokens = tokens[chainKey];
    if (!chainTokens) return null;

    return chainTokens[addr] || null;
}
