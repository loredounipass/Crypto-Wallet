import * as React from 'react';
import useAllWallets from '../hooks/useAllWallets';
import { useTranslation } from 'react-i18next'; 
import { Link as RouterLink } from 'react-router-dom';
import { getCoinLogo, getCoinFallbackLogo, getCoinFee, normalizeCoin } from './utils/Chains';
import { getDisplayableAddress } from './utils/Display';


export default function MyWallets() {
    const { t } = useTranslation();
    const { allWalletInfo } = useAllWallets();
    const [isSmallScreen, setIsSmallScreen] = React.useState(() => window.innerWidth <= 640);
    
    

    React.useEffect(() => {
        const onResize = () => setIsSmallScreen(window.innerWidth <= 640);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleCoinImageError = (coin) => (event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = getCoinFallbackLogo(coin);
    };

    return (
        <div style={{ width: '100%', padding: isSmallScreen ? '4px' : '16px', marginBottom: isSmallScreen ? '16px' : '32px' }}>
            {isSmallScreen ? (
                <div className="grid grid-cols-1 gap-2">
                    {allWalletInfo.map((wallet) => (
                        <div key={wallet.walletId} className="rounded-xl border p-3 shadow-sm" style={{ borderColor: '#2D2D44', backgroundColor: '#1A1A2E' }}>
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                                        {t('currency')}: {/* Usar t para traducir */}
                                        </p>
                                        <div className="flex items-center gap-2">
                                                <img
                                                    width={20}
                                                    src={getCoinLogo(wallet.coin)}
                                                    alt={wallet.coin}
                                                    onError={handleCoinImageError(wallet.coin)}
                                                />
                                                <p className="text-sm" style={{ color: '#FFFFFF' }}>{wallet.coin}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                                        {t('address')}: 
                                        </p>
                                        <RouterLink className="text-sm text-blue-500 hover:underline" to={`/wallet/${wallet.coin.toLowerCase()}`}>
                                                {getDisplayableAddress(wallet.address)}
                                        </RouterLink>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                                        {t('balance')}: 
                                        </p>
                                        <p className="text-sm font-bold" style={{ color: '#60A5FA' }}>
                                            {Math.max(0, Number(wallet.balance || 0) - getCoinFee(normalizeCoin(wallet.coin))).toFixed(4)} {wallet.coin}
                                        </p>
                                    </div>

        
                                    <div>
                                        <RouterLink 
                                            to={`/wallet/${wallet.coin.toLowerCase()}`} 
                                            className="block w-full"
                                        >
                                            <button
                                                type="button"
                                                className="mt-2 w-full rounded-2xl bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700"
                                            >
                                                {t('view_details')} 
                                            </button>
                                        </RouterLink>
                                    </div>
                                </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {allWalletInfo.map((wallet) => (
                            <div key={wallet.walletId} className="rounded-xl border p-4 shadow-sm" style={{ borderColor: '#2D2D44', backgroundColor: '#1A1A2E', minHeight: '100px' }}>
                                    <div className="flex items-center gap-2">
                                            <img
                                                width={20}
                                                src={getCoinLogo(wallet.coin)}
                                                alt={wallet.coin}
                                                onError={handleCoinImageError(wallet.coin)}
                                            />
                                            <p className="text-sm" style={{ color: '#FFFFFF' }}>
                                                {wallet.coin}
                                            </p>
                                    </div>
                                    <div className="mt-2 flex flex-col gap-2">
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                                            {t('address')}: 
                                            </p>
                                            <RouterLink className="text-sm text-blue-500 hover:underline" to={`/wallet/${wallet.coin.toLowerCase()}`}>
                                                    {getDisplayableAddress(wallet.address)}
                                            </RouterLink>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: '#9CA3AF' }}>
                                            {t('balance')}: 
                                            </p>
                                            <p className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                                                {Math.max(0, Number(wallet.balance || 0) - getCoinFee(normalizeCoin(wallet.coin))).toFixed(4)} {wallet.coin}
                                            </p>
                                        </div>

                                       
                                        <div>
                                            <RouterLink 
                                                to={`/wallet/${wallet.coin.toLowerCase()}`} 
                                                className="block w-full"
                                            >
                                                <button
                                                    type="button"
                                                    className="mt-2 w-full rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                                                >
                                                    {t('view_details')} 
                                                </button>
                                            </RouterLink>
                                        </div>
                                    </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
