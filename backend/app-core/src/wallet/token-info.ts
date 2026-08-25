export interface TokenInfo {
    symbol: string;
    decimals: number;
    coinGeckoId: string;
}

const DEFAULT_TOKENS: Record<string, TokenInfo> = {};



// LEE LA VARIABLE DE ENTORNO PARA CONSTRUIR UN MAPA DE TOKENS SOPORTADOS RETORNANDO EL OBJETO CONFIGURADO O POR DEFECTO
function buildTokenMap(): Record<string, TokenInfo> {
    const envTokens = process.env.SUPPORTED_TOKEN_ADDRESSES;
    if (envTokens) {
        try {
            const parsed = JSON.parse(envTokens) as Record<string, TokenInfo>;
            return { ...DEFAULT_TOKENS, ...parsed };
        } catch {
        }
    }
    return { ...DEFAULT_TOKENS };
}

const tokens: Record<string, TokenInfo> = buildTokenMap();



// RECUPERA Y DEVUELVE LA INFORMACION DETALLADA DEL TOKEN CONSULTANDO EL MAPA CON LA DIRECCION EN MINUSCULAS
export function getTokenInfo(tokenAddress: string): TokenInfo | null {
    return tokens[tokenAddress.toLowerCase()] || null;
}
