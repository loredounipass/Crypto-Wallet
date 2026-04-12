import React, { useState } from 'react';
import { Avatar, useMediaQuery, useTheme } from '../ui/material';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import useWalletInfo from '../hooks/useWalletInfo';
import useCoinPrice from '../hooks/useCoinPrice';
import { useParams, useHistory } from 'react-router-dom';
import {
    getCoinDecimalsPlace,
    getCoinFee,
    getDefaultNetworkId,
    getNetworkName,
    getCoinLogo,
    getCoinFallbackLogo
} from '../components/utils/Chains';
import useWithdraw from '../hooks/useWithdraw';
import createWallet from '../hooks/createWallet';
import CoinTransactions from '../components/CoinTransactions';
import useTransitions from '../hooks/useTransactions';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../ui/styles';

const WalletIconBase = ({ children, size = 20, color = "currentColor" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
);

const BackIcon = ({ size = 20, color = "currentColor" }) => (
    <WalletIconBase size={size} color={color}>
        <path d="M15 18l-6-6 6-6" />
        <path d="M9 12h10" />
    </WalletIconBase>
);

const CopyIcon = ({ size = 20, color = "currentColor" }) => (
    <WalletIconBase size={size} color={color}>
        <rect x="9" y="9" width="10" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </WalletIconBase>
);

export default function Wallet() {
    const { t } = useTranslation();
    const history = useHistory();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(muiTheme.breakpoints.down("md"));
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';
    
    const [copied, setCopied] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [error, setError] = useState('');

    const { walletId } = useParams();
    const defaultNetworkId = getDefaultNetworkId(walletId);
    const { walletInfo, isWalletLoading, setWalletInfo } = useWalletInfo(walletId);
    const { coinPrice } = useCoinPrice(walletId);
    const { withdraw } = useWithdraw(walletId);
    const { transactions, getTransactions } = useTransitions(walletId);

    const truncateToDecimals = (num, dec) => {
        const calcDec = Math.pow(10, dec);
        return Math.trunc(num * calcDec) / calcDec;
    };

    const [withdrawLoading, setWithdrawLoading] = useState(false);

    const handleWithdraw = async () => {
        console.log('[Withdraw] handleWithdraw called', { withdrawAmount, withdrawAddress, balance: walletInfo.balance });
        if (!withdrawAmount || !withdrawAddress) {
            setError('Ingresa una dirección y cantidad válida.');
            return;
        }
        if (parseFloat(withdrawAmount) > parseFloat(walletInfo.balance)) {
            setError(t('insufficient_funds'));
            return;
        }
        setWithdrawLoading(true);
        setError('');
        try {
            const result = await withdraw(withdrawAmount, withdrawAddress);
            console.log('[Withdraw] result:', result);
            if (result === 'success') {
                getTransactions();
                setWithdrawAmount('');
                setWithdrawAddress('');
                setError('');
            } else {
                setError(result?.msg || 'Error al procesar el retiro.');
            }
        } catch (err) {
            console.error('[Withdraw] error:', err);
            setError(err?.message || 'Error al procesar el retiro.');
        } finally {
            setWithdrawLoading(false);
        }
    };

    const setMaxAmount = () => {
        setWithdrawAmount(walletInfo.balance);
        setError('');
    };

    const handleCreateWallet = async () => {
        const wallet = await createWallet({
            coin: walletId,
            chainId: defaultNetworkId,
        });
        if (wallet) {
            setWalletInfo(wallet);
        }
    };

    const styles = {
        container: {
            padding: isMobile ? "4px" : isTablet ? "12px" : "32px",
            maxWidth: "900px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
            overflowX: "hidden",
        },
        section: {
            backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            marginBottom: isMobile ? "12px" : "24px",
        },
        input: {
            width: "100%",
            padding: isMobile ? "12px 14px" : "14px 16px",
            borderRadius: "12px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            backgroundColor: isDark ? "#0F0F1A" : "#FFFFFF",
            color: isDark ? "#FFFFFF" : "#1A1A2E",
            fontSize: isMobile ? "13px" : "14px",
            outline: "none",
            boxSizing: "border-box",
        },
        button: (primary = false, disabled = false) => ({
            backgroundColor: disabled ? (isDark ? "#2D2D44" : "#E5E7EB") : (primary ? "#2186EB" : "transparent"),
            color: disabled ? (isDark ? "#6B7280" : "#9CA3AF") : (primary ? "white" : (isDark ? "#FFFFFF" : "#1A1A2E")),
            border: primary ? "none" : `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            borderRadius: "12px",
            padding: isMobile ? "12px 16px" : "14px 24px",
            fontWeight: 600,
            cursor: disabled ? "not-allowed" : "pointer",
            textTransform: "none",
            fontSize: isMobile ? "13px" : "14px",
        }),
    };

    if (isWalletLoading) {
        return (
            <div style={styles.container}>
                <div style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>Cargando...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Back */}
            <div 
                style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: isMobile ? "12px" : "24px", cursor: "pointer", color: isDark ? "#FFFFFF" : "#1A1A2E" }}
                onClick={() => history.push('/wallets')}
            >
                <BackIcon size={20} color={isDark ? "#FFFFFF" : "#1A1A2E"} />
                <span style={{ fontWeight: 500 }}>Volver a Billeteras</span>
            </div>

            {!isWalletLoading && walletInfo ? (
                <>
                    {/* Balance Card */}
                    <div style={styles.section}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                            <Avatar 
                                src={getCoinLogo(walletInfo.coin)}
                                imgProps={{ onError: (e) => { e.currentTarget.src = getCoinFallbackLogo(walletInfo.coin); } }}
                                style={{ width: isMobile ? 46 : 56, height: isMobile ? 46 : 56 }}
                            />
                            <div>
                                <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "14px" }}>Balance</div>
                                <div style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: isMobile ? "24px" : "32px", fontWeight: 700 }}>
                                    {truncateToDecimals(walletInfo.balance, getCoinDecimalsPlace(walletInfo.coin))} <span style={{ fontSize: isMobile ? "16px" : "20px" }}>{walletInfo.coin}</span>
                                </div>
                            </div>
                        </div>
                        {coinPrice && (
                            <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "16px" }}>
                                ≈ ${(parseFloat(walletInfo.balance) * parseFloat(coinPrice)).toFixed(2)} USD
                            </div>
                        )}
                    </div>

                    {/* Deposit */}
                    <div style={styles.section}>
                        <h2 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
                            Depositar
                        </h2>
                        <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "14px", marginBottom: "16px" }}>
                            Tu direccion ({walletInfo.coin} - {getNetworkName(walletInfo.chainId)})
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", marginBottom: "16px" }}>
                            <input 
                                type="text" 
                                value={walletInfo.address} 
                                readOnly 
                                style={{ ...styles.input, fontFamily: "monospace", flex: 1 }}
                            />
                            <CopyToClipboard
                                text={walletInfo.address}
                                onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                            >
                                <div style={{
                                    padding: isMobile ? "12px" : "14px",
                                    borderRadius: "12px",
                                    backgroundColor: isDark ? "#2D2D44" : "#F3F4F6",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <CopyIcon size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                </div>
                            </CopyToClipboard>
                        </div>
                        
                        {copied && <div style={{ color: "#4CAF50", fontSize: "14px", marginBottom: "16px" }}>Direccion copiada!</div>}

                        <div style={{ display: "flex", justifyContent: "center", padding: isMobile ? "8px" : "16px" }}>
                            <div style={{ padding: isMobile ? "10px" : "16px", backgroundColor: "white", borderRadius: "12px" }}>
                                <QRCode value={walletInfo.address} size={isMobile ? 140 : 180} />
                            </div>
                        </div>
                    </div>

                    {/* Withdraw */}
                    <div style={styles.section}>
                        <h2 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
                            Retirar
                        </h2>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <input 
                                type="text"
                                value={withdrawAddress}
                                onChange={(e) => { setWithdrawAddress(e.target.value); setError(''); }}
                                placeholder={`Direccion de ${getNetworkName(walletInfo.chainId)}`}
                                style={styles.input}
                            />
                            
                            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
                                <input 
                                    type="number"
                                    value={withdrawAmount || ''}
                                    onChange={(e) => { setWithdrawAmount(e.target.value); setError(''); }}
                                    placeholder="Cantidad"
                                    style={{ ...styles.input, flex: isMobile ? undefined : 2 }}
                                />
                                <button onClick={setMaxAmount} style={styles.button()}>
                                    Max
                                </button>
                            </div>

                            <button 
                                onClick={handleWithdraw}
                                disabled={!(withdrawAmount > 0 && withdrawAddress && parseFloat(withdrawAmount) <= parseFloat(walletInfo.balance))}
                                style={styles.button(true, !(withdrawAmount > 0 && withdrawAddress && parseFloat(withdrawAmount) <= parseFloat(walletInfo.balance)))}
                            >
                                Retirar
                            </button>

                            {error && <div style={{ color: "#F44336", fontSize: "14px" }}>{error}</div>}

                            <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "12px" }}>
                                Comision: {getCoinFee(walletInfo.coin)} {walletInfo.coin}
                            </div>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div style={styles.section}>
                        <h2 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
                            Transacciones
                        </h2>
                        <CoinTransactions
                            transactions={transactions}
                            chainId={defaultNetworkId}
                            coin={walletId}
                            hideDateOnMobile
                            compactMobile
                        />
                    </div>
                </>
            ) : walletInfo === null ? (
                <div style={styles.section}>
                    <h2 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "24px", fontWeight: 600, textAlign: "center", marginBottom: "16px" }}>
                        Crear Billetera {walletId.toUpperCase()}
                    </h2>
                    <div style={{ textAlign: "center", marginBottom: "24px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                        No tienes una billetera para esta moneda
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <button onClick={handleCreateWallet} style={styles.button(true)}>
                            Crear Billetera
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
