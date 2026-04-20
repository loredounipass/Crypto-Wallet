import { useState, useEffect } from 'react';
import Wallet from '../services/wallet'
import Price from '../services/price'
import { getCoinFee, normalizeCoin } from '../components/utils/Chains'

const CACHE_TTL_MS = 30 * 1000;
let cache = {
    timestamp: 0,
    wallets: [],
    balance: 0,
};
let inflightRequest = null;

export function invalidateWalletsCache() {
    cache = {
        timestamp: 0,
        wallets: [],
        balance: 0,
    };
}

async function fetchAllWalletsAndBalance(force = false) {
    const now = Date.now();
    const isCacheValid = (now - cache.timestamp) < CACHE_TTL_MS;

    if (!force && isCacheValid) {
        return {
            wallets: cache.wallets,
            balance: cache.balance,
        };
    }

    if (inflightRequest) {
        return inflightRequest;
    }

    inflightRequest = (async () => {
        const { data } = await Wallet.getAllWalletInfo();
        const wallets = Array.isArray(data) ? data : [];

        const uniqueCoins = [...new Set(wallets.map((wallet) => String(wallet.coin || '').toUpperCase()))];
        const priceEntries = await Promise.all(
            uniqueCoins.map(async (coin) => {
                try {
                    const { data: priceData } = await Price.getPrice(coin);
                    return [coin, Number(priceData?.USD || 0)];
                } catch (_) {
                    return [coin, 0];
                }
            })
        );

        const priceMap = Object.fromEntries(priceEntries);
        const balance = wallets.reduce((acc, wallet) => {
            const coin = String(wallet.coin || '').toUpperCase();
            const usdPrice = Number(priceMap[coin] || 0);
            const totalBalance = Math.max(0, Number(wallet.balance || 0));
            return acc + (totalBalance * usdPrice);
        }, 0);

        cache = {
            timestamp: Date.now(),
            wallets,
            balance,
        };

        return { wallets, balance };
    })().finally(() => {
        inflightRequest = null;
    });

    return inflightRequest;
}

export default function useAllWallets() {
    const [allWalletInfo, setAllWalletInfo] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function getAllWalletInfo() {
            setIsLoading(true);
            try {
                const { wallets, balance } = await fetchAllWalletsAndBalance();
                if (isMounted) {
                    setAllWalletInfo(wallets);
                    setWalletBalance(balance);
                }
            } catch (err) {
                if (isMounted) {
                    setAllWalletInfo([]);
                    setWalletBalance(0);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        getAllWalletInfo()
        return () => {
            isMounted = false;
        };
    }, [])

    async function refreshWallets() {
        setIsLoading(true);
        try {
            const { wallets, balance } = await fetchAllWalletsAndBalance(true);
            setAllWalletInfo(wallets);
            setWalletBalance(balance);
        } finally {
            setIsLoading(false);
        }
    }

    return {
        allWalletInfo,
        walletBalance,
        isLoading,
        refreshWallets
    }
}
