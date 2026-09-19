// ============================================================================
//  MULTI-CHAIN TOKEN REGISTRY
//  Estructura: TOKEN_MAP[chainId][tokenAddress.toLowerCase()] = { symbol, decimals, coinGeckoId }
//
//  ⚠️  REGLA CRÍTICA: Las direcciones DEBEN estar en minúsculas (lowercase).
//      La EVM permite checksummed addresses (EIP-55), pero nuestro lookup
//      normaliza con .toLowerCase() para evitar mismatches silenciosos.
//
//  ⚠️  REGLA CRÍTICA: Los decimales VARÍAN entre chains para el mismo token.
//      USDT y USDC en Ethereum/Polygon = 6 decimales
//      USDT y USDC en BNB Chain = 18 decimales
//      Confundir esto produce un factor de error de ×10¹² en el Ledger.
// ============================================================================

const TOKEN_MAP = {

    // ==========================================
    //   REDES TESTNET (Para Pruebas Gratuitas)
    // ==========================================

    // ---- SEPOLIA (Testnet de Ethereum - Chain ID: 11155111) ----
    "11155111": {
        '0xa2025b15a1c6c2217e490cc11f2a11a41ae65b1e': { symbol: 'USDT', decimals: 6, coinGeckoId: null },
        '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC', decimals: 6, coinGeckoId: null }
    },

    // ---- BNB SMART CHAIN TESTNET (Chain ID: 97) ----
    "97": {
        '0x337610d27c682e347c9cd60bd4b3b107c913ef11': { symbol: 'USDT', decimals: 18, coinGeckoId: null },
        '0x64544969ed7ebf5f083679233325356ebe738930': { symbol: 'USDC', decimals: 18, coinGeckoId: null } // ⚠️ BSC usa 18 decimales
    },

    // ---- AMOY (Testnet de Polygon - Chain ID: 80002) ----
    "80002": {
        '0x1fd169a4e50c3fd924c6de627b90a079c609c916': { symbol: 'USDT', decimals: 6, coinGeckoId: null },
        '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582': { symbol: 'USDC', decimals: 6, coinGeckoId: null }
    },

    // ---- SONIC TESTNET (Chain ID: 14601) ----
    "14601": {
        '0x0ba304580ee7c9a980cf72e55f5ed2e9fd30bc51': { symbol: 'tUSDT', decimals: 6, coinGeckoId: null }
        // Nota: Aún no hemos agregado USDC para Sonic porque no hay una dirección oficial estándar
    },

    // ==========================================
    //   REDES MAINNET (Producción)
    // ==========================================

    // ---- ETHEREUM MAINNET (Chain ID: 1) ----
    "1": {
        '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6, coinGeckoId: 'tether' },
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6, coinGeckoId: 'usd-coin' }
    },

    // ---- BNB SMART CHAIN MAINNET (Chain ID: 56) ----
    "56": {
        '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18, coinGeckoId: 'tether' },
        '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', decimals: 18, coinGeckoId: 'usd-coin' } // ⚠️ BSC usa 18 decimales
    },

    // ---- POLYGON MAINNET (Chain ID: 137) ----
    "137": {
        '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6, coinGeckoId: 'tether' },
        '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': { symbol: 'USDC', decimals: 6, coinGeckoId: 'usd-coin' } // Native USDC Polygon
    }
}


// ============================================================================
//  FUNCIÓN DE BÚSQUEDA SEGURA MULTI-CHAIN
// ============================================================================
//
//  Firma principal: getTokenInfo(chainId, tokenAddress)
//  Firma legacy:    getTokenInfo(tokenAddress)  ← backward compatible
//
//  Estrategia de resolución:
//    1) Si se pasan 2 argumentos → lookup directo por chainId + address (O(1))
//    2) Si se pasa 1 argumento  → búsqueda lineal en todos los chains (fallback)
//
//  La normalización toLowerCase() es OBLIGATORIA porque la EVM permite
//  direcciones en mixed-case (EIP-55 checksum) pero las claves del mapa
//  están almacenadas en minúsculas.
// ============================================================================

function getTokenInfo(chainIdOrAddress, tokenAddress) {
    // --- Backward compatibility: si solo se pasa 1 argumento, es la firma vieja ---
    if (tokenAddress === undefined) {
        const addr = String(chainIdOrAddress).toLowerCase()
        for (const chainTokens of Object.values(TOKEN_MAP)) {
            if (chainTokens[addr]) return chainTokens[addr]
        }
        return null
    }

    // --- Firma nueva: getTokenInfo(chainId, tokenAddress) ---
    const chainKey = String(chainIdOrAddress)
    const addr = tokenAddress.toLowerCase()

    const chainTokens = TOKEN_MAP[chainKey]
    if (!chainTokens) return null

    return chainTokens[addr] || null
}


module.exports = { getTokenInfo, TOKEN_MAP }
