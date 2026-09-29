import { useState, useEffect } from 'react';
import Wallet from '../services/wallet'



// CUSTOM HOOK THAT FETCHES AND MANAGES THE WALLET INFORMATION FOR A SPECIFIC COIN
export default function useWalletInfo(coin) {
    const [walletInfo, setWalletInfo] = useState(null);
    const [isInfoLoading, setLoading] = useState(true);



    // EFFECT THAT ASYNCHRONOUSLY LOADS THE WALLET DETAILS FROM THE SERVER
    useEffect(() => {
        async function getWalletInfo() {
            try {
                const { data } = await Wallet.getWalletInfo(coin)
                if (data)
                    setWalletInfo(data)
            } catch (err) { }

            setLoading(false)
        }

        getWalletInfo()
    }, [coin])

    return {
        walletInfo,
        isInfoLoading,
        setWalletInfo,
        setLoading
    }
}