import { useState, useEffect } from 'react';
import Wallet from '../services/wallet'
import Price from '../services/price'

const CACHE_TTL_MS = 30 * 1000;
let cache = {
    timestamp: 0,
    tokens: [],
    usdValue: 0,
};
let inflightRequest = null;




// CLEARS THE IN-MEMORY TOKEN BALANCES CACHE
export function invalidateTokensCache() {
    cache = {
        timestamp: 0,
        tokens: [],
        usdValue: 0,
    };
}




// ASYNCHRONOUSLY FETCHES ALL ERC20 TOKENS AND CALCULATES THEIR TOTAL USD VALUE
async function fetchTokenBalances(force = false) {
    const now = Date.now();
    const isCacheValid = (now - cache.timestamp) < CACHE_TTL_MS;

    if (!force && isCacheValid) {
        return {
            tokens: cache.tokens,
            usdValue: cache.usdValue,
        };
    }

    if (inflightRequest) {
        return inflightRequest;
    }

    inflightRequest = (async () => {
        const { data } = await Wallet.getTokenBalances();
        const tokens = Array.isArray(data) ? data : [];

        const STABLECOIN_FALLBACK_PRICE = { USDT: 1, USDC: 1 };
        const uniqueGeckoIds = [...new Set(tokens.reduce((acc, t) => {
            if (t.coinGeckoId) acc.push(t.coinGeckoId);
            return acc;
        }, []))];
        const priceEntries = await Promise.all(
            uniqueGeckoIds.map(async (id) => {
                try {
                    const { data: priceData } = await Price.getPrice(id);
                    return [id, Number(priceData?.USD || 0)];
                } catch (_) {
                    return [id, 0];
                }
            })
        );
        const priceMap = Object.fromEntries(priceEntries);
        const usdValue = tokens.reduce((acc, t) => {
            const usdPrice = t.coinGeckoId
                ? Number(priceMap[t.coinGeckoId] || 0)
                : (STABLECOIN_FALLBACK_PRICE[String(t.tokenSymbol).toUpperCase()] || 0);
            return acc + (t.availableBalance * usdPrice);
        }, 0);

        cache = {
            timestamp: Date.now(),
            tokens,
            usdValue,
        };

        return { tokens, usdValue };
    })().finally(() => {
        inflightRequest = null;
    });

    return inflightRequest;
}




// CUSTOM HOOK THAT PROVIDES REACTIVE ACCESS TO ALL TOKEN BALANCES AND THEIR TOTAL FIAT VALUE
export default function useTokenBalances() {
    const [tokenBalances, setTokenBalances] = useState([]);
    const [tokenUsdValue, setTokenUsdValue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);




    // EFFECT THAT LOADS THE TOKEN BALANCES ON MOUNT AND UPDATES THE STATE
    useEffect(() => {
        let isMounted = true;
        async function load() {
            setIsLoading(true);
            try {
                const { tokens, usdValue } = await fetchTokenBalances();
                if (isMounted) {
                    setTokenBalances(tokens);
                    setTokenUsdValue(usdValue);
                }
            } catch (err) {
                if (isMounted) {
                    setTokenBalances([]);
                    setTokenUsdValue(0);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        load()
        return () => { isMounted = false; };
    }, [])




    // FORCES A REFRESH OF TOKEN BALANCES BYPASSING THE LOCAL CACHE
    async function refreshTokens() {
        setIsLoading(true);
        try {
            const { tokens, usdValue } = await fetchTokenBalances(true);
            setTokenBalances(tokens);
            setTokenUsdValue(usdValue);
        } finally {
            setIsLoading(false);
        }
    }

    return {
        tokenBalances,
        tokenUsdValue,
        isLoading,
        refreshTokens,
    }
}
