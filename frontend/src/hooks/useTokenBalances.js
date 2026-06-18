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

export function invalidateTokensCache() {
    cache = {
        timestamp: 0,
        tokens: [],
        usdValue: 0,
    };
}

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

        const uniqueGeckoIds = [...new Set(tokens
            .filter(t => t.coinGeckoId)
            .map(t => t.coinGeckoId)
        )];
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
            const usdPrice = Number(priceMap[t.coinGeckoId] || 0);
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

export default function useTokenBalances() {
    const [tokenBalances, setTokenBalances] = useState([]);
    const [tokenUsdValue, setTokenUsdValue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

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
