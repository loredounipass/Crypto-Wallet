import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import useWalletInfo from '../hooks/useWalletInfo';
import useCoinPrice from '../hooks/useCoinPrice';
import { useParams, useHistory } from 'react-router-dom';
import {
    getCoinDecimalsPlace,
    getCoinFee,
    getCoinMinWithdraw,
    getDefaultNetworkId,
    getNetworkName,
    getCoinLogo,
    getCoinFallbackLogo,
    normalizeCoin
} from '../components/utils/Chains';
import useWithdraw from '../hooks/useWithdraw';
import createWallet from '../hooks/createWallet';
import CoinTransactions from '../components/CoinTransactions';
import useTransitions from '../hooks/useTransactions';
import TransactionToast from '../components/TransactionToast';

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
    const history = useHistory();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
    const [isTablet, setIsTablet] = useState(() => window.innerWidth <= 768);
    const [copied, setCopied] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [error, setError] = useState('');
    const [activeAction, setActiveAction] = useState('deposit');

    const { walletId } = useParams();
    const defaultNetworkId = getDefaultNetworkId(walletId);
    const { walletInfo, isWalletLoading, setWalletInfo } = useWalletInfo(walletId);
    const { coinPrice } = useCoinPrice(walletId);
    const { withdraw } = useWithdraw(walletId);
    const { transactions, getTransactions, toast, dismissToast } = useTransitions(walletId);

    const truncateToDecimals = (num, dec) => {
        const calcDec = Math.pow(10, dec);
        return Math.trunc(num * calcDec) / calcDec;
    };

    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const coinCode = normalizeCoin(walletInfo?.coin || walletId);
    const fee = getCoinFee(coinCode);
    const minWithdraw = getCoinMinWithdraw(coinCode);
    const balanceNumber = Number(walletInfo?.balance || 0);
    const maxWithdrawable = balanceNumber;
    const hasInsufficientFunds = maxWithdrawable < minWithdraw;

    const isValidAddressForCoin = (address, coin) => {
        const trimmed = String(address || '').trim();
        if (!trimmed) return false;

        // Current supported coins are EVM-based in this UI.
        if (['bnb', 'avax', 'eth', 'matic', 'ftm', 'op'].includes(coin)) {
            return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
        }

        return trimmed.length >= 10;
    };

    const handleWithdraw = async () => {
        const normalizedAddress = String(withdrawAddress || '').trim();
        const amountNumber = Number(withdrawAmount);

        if (!withdrawAmount || !normalizedAddress) {
            setError('Ingresa una dirección y cantidad válida.');
            return;
        }
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            setError('Ingresa un monto válido mayor a 0.');
            return;
        }
        if (!isValidAddressForCoin(normalizedAddress, coinCode)) {
            setError(`Dirección inválida para ${coinCode.toUpperCase()}.`);
            return;
        }
        if (amountNumber > maxWithdrawable) {
            setError(`Monto inválido. Máximo disponible: ${maxWithdrawable.toFixed(getCoinDecimalsPlace(coinCode))}`);
            return;
        }
        if (amountNumber <= fee) {
            setError(`Monto inválido. El monto debe ser mayor a la comisión (${fee} ${coinCode.toUpperCase()})`);
            return;
        }
        setWithdrawLoading(true);
        setError('');
        try {
            const result = await withdraw(withdrawAmount, normalizedAddress);
            if (result === 'success') {
                getTransactions();
                setWithdrawAmount('');
                setWithdrawAddress('');
                setError('');
            } else {
                setError(result?.msg || 'Error al procesar el retiro.');
            }
        } catch (err) {
            setError(err?.message || 'Error al procesar el retiro.');
        } finally {
            setWithdrawLoading(false);
        }
    };

    const setMaxAmount = () => {
        setWithdrawAmount(String(truncateToDecimals(maxWithdrawable, getCoinDecimalsPlace(coinCode))));
        setError('');
    };

    const getWithdrawButtonText = () => {
        if (withdrawLoading) return 'Procesando...';
        if (hasInsufficientFunds) return 'Fondos Insuficientes';
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return 'Ingresa un monto';
        if (Number(withdrawAmount) <= fee) return 'Monto debe ser > comisión';
        if (Number(withdrawAmount) > maxWithdrawable) return 'Monto excede máximo';
        if (Number(withdrawAmount) < minWithdraw) return 'Monto < mínimo';
        if (!withdrawAddress) return 'Ingresa una dirección';
        if (!isValidAddressForCoin(withdrawAddress, coinCode)) return 'Dirección Inválida';
        return 'Retirar';
    };

    const canWithdraw = Number.isFinite(Number(withdrawAmount))
        && Number(withdrawAmount) > fee
        && Number(withdrawAmount) <= maxWithdrawable + 0.00000001 // Small tolerance for float
        && Number(withdrawAmount) >= minWithdraw
        && isValidAddressForCoin(withdrawAddress, coinCode)
        && !withdrawLoading
        && !hasInsufficientFunds;

    const handleCreateWallet = async () => {
        const wallet = await createWallet({
            coin: walletId,
            chainId: defaultNetworkId,
        });
        if (wallet) {
            setWalletInfo(wallet);
        }
    };

    React.useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth <= 640);
            setIsTablet(window.innerWidth <= 768);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

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
            backgroundColor: "#1A1A2E",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
            border: "1px solid #2D2D44",
            marginBottom: isMobile ? "12px" : "24px",
        },
        input: {
            width: "100%",
            padding: isMobile ? "12px 14px" : "14px 16px",
            borderRadius: "12px",
            border: "1px solid #2D2D44",
            backgroundColor: "#0F0F1A",
            color: "#FFFFFF",
            fontSize: isMobile ? "13px" : "14px",
            outline: "none",
            boxSizing: "border-box",
        },
        button: (primary = false, disabled = false) => ({
            backgroundColor: disabled ? "#2D2D44" : (primary ? "#2186EB" : "transparent"),
            color: disabled ? "#6B7280" : (primary ? "white" : "#FFFFFF"),
            border: primary ? "none" : "1px solid #2D2D44",
            borderRadius: "12px",
            padding: isMobile ? "12px 16px" : "14px 24px",
            fontWeight: 600,
            cursor: disabled ? "not-allowed" : "pointer",
            textTransform: "none",
            fontSize: isMobile ? "13px" : "14px",
        }),
        actionSwitcher: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            backgroundColor: "#0F0F1A",
            border: "1px solid #2D2D44",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "12px",
        },
        actionTab: (isActive) => ({
            border: "none",
            borderRadius: "10px",
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            backgroundColor: isActive ? "#2186EB" : "transparent",
            color: isActive ? "#FFFFFF" : "#9CA3AF",
            transition: "all 0.2s ease",
        }),
        inputActionButton: {
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            borderRadius: "8px",
            padding: "6px 10px",
            backgroundColor: "#2D2D44",
            color: "#E5E7EB",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "44px",
        },
    };
    const useCompactActions = isTablet;
    const actionSectionStyle = useCompactActions
        ? styles.section
        : { ...styles.section, marginBottom: 0, height: "100%" };

    const depositSection = (
        <div style={actionSectionStyle}>
            <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
                Depositar
            </h2>
            <div style={{ color: "#9CA3AF", fontSize: "14px", marginBottom: "16px" }}>
                Tu direccion ({walletInfo?.coin || walletId} - {getNetworkName(walletInfo?.chainId || defaultNetworkId)})
            </div>
            
            <div style={{ marginBottom: "16px", position: "relative" }}>
                <input 
                    type="text" 
                    value={walletInfo?.address || ''} 
                    readOnly 
                    style={{ ...styles.input, fontFamily: "monospace", paddingRight: "52px" }}
                />
                <CopyToClipboard
                    text={walletInfo?.address || ''}
                    onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                >
                    <button type="button" style={styles.inputActionButton} aria-label="Copiar dirección">
                        <CopyIcon size={16} color="#9CA3AF" />
                    </button>
                </CopyToClipboard>
            </div>
            
            {copied && <div style={{ color: "#4CAF50", fontSize: "14px", marginBottom: "16px" }}>Direccion copiada!</div>}

            <div style={{ display: "flex", justifyContent: "center", padding: isMobile ? "8px" : "16px" }}>
                <div style={{ padding: isMobile ? "10px" : "16px", backgroundColor: "white", borderRadius: "12px" }}>
                    <QRCode value={walletInfo?.address || ''} size={isMobile ? 140 : 180} />
                </div>
            </div>
        </div>
    );

    const withdrawSection = (
        <div style={actionSectionStyle}>
            <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
                Retirar
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input 
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => { setWithdrawAddress(e.target.value); setError(''); }}
                    placeholder={`Direccion de ${getNetworkName(walletInfo?.chainId || defaultNetworkId)}`}
                    style={styles.input}
                />
                
                <div style={{ position: "relative" }}>
                    <input 
                        type="number"
                        value={withdrawAmount || ''}
                        onChange={(e) => { setWithdrawAmount(e.target.value); setError(''); }}
                        placeholder="Cantidad"
                        style={{ ...styles.input, paddingRight: "58px" }}
                    />
                    <button type="button" onClick={setMaxAmount} style={styles.inputActionButton}>
                        Max
                    </button>
                </div>

                <button 
                    onClick={handleWithdraw}
                    disabled={!canWithdraw}
                    style={styles.button(true, !canWithdraw)}
                >
                    {getWithdrawButtonText()}
                </button>

                {hasInsufficientFunds && (
                    <div style={{ color: "#F44336", fontSize: "14px", fontWeight: 500, textAlign: 'center' }}>
                        Monto mínimo de retiro: {minWithdraw} {coinCode.toUpperCase()}
                    </div>
                )}

                {error && <div style={{ color: "#F44336", fontSize: "14px" }}>{error}</div>}

                <div style={{ color: "#9CA3AF", fontSize: "12px" }}>
                    Comision de red: {fee} {walletInfo?.coin || coinCode.toUpperCase()}
                </div>
                {withdrawAmount && Number(withdrawAmount) > 0 && (
                    <div style={{ color: "#9CA3AF", fontSize: "12px", marginTop: "-8px" }}>
                        Recibirás: {Math.max(0, Number(withdrawAmount) - fee).toFixed(getCoinDecimalsPlace(coinCode))} {walletInfo?.coin || coinCode.toUpperCase()}
                    </div>
                )}
                {maxWithdrawable > 0 && (
                    <div style={{ color: "#9CA3AF", fontSize: "12px" }}>
                        Máximo disponible: {truncateToDecimals(maxWithdrawable, getCoinDecimalsPlace(coinCode))} {walletInfo?.coin || coinCode.toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    );

    if (isWalletLoading) {
        return (
            <div style={styles.container}>
                <div style={{ color: "#9CA3AF" }}>Cargando...</div>
                <TransactionToast toast={toast} onClose={dismissToast} />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full" style={styles.container}>
            {/* Back */}
            <div 
                style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: isMobile ? "12px" : "24px", cursor: "pointer", color: "#FFFFFF" }}
                onClick={() => history.push('/wallets')}
            >
                <BackIcon size={20} color="#FFFFFF" />
                <span style={{ fontWeight: 500 }}>Volver a Billeteras</span>
            </div>

            {!isWalletLoading && walletInfo ? (
                <>
                    {/* Balance Card */}
                    <div style={styles.section}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                            <div
                                style={{
                                    width: isMobile ? 46 : 56,
                                    height: isMobile ? 46 : 56,
                                    borderRadius: "999px",
                                    overflow: "hidden",
                                    backgroundColor: "#2D2D44",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <img
                                    src={getCoinLogo(walletInfo.coin)}
                                    alt={walletInfo.coin}
                                    onError={(e) => { e.currentTarget.src = getCoinFallbackLogo(walletInfo.coin); }}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                            <div>
                                <div style={{ color: "#9CA3AF", fontSize: "14px" }}>Balance</div>
                                <div style={{ color: "#FFFFFF", fontSize: isMobile ? "24px" : "32px", fontWeight: 700 }}>
                                    {truncateToDecimals(maxWithdrawable, getCoinDecimalsPlace(walletInfo.coin))} <span style={{ fontSize: isMobile ? "16px" : "20px" }}>{walletInfo.coin}</span>
                                </div>
                            </div>
                        </div>
                        {coinPrice && (
                            <div style={{ color: "#9CA3AF", fontSize: "16px", marginTop: "8px" }}>
                                ≈ ${(parseFloat(maxWithdrawable) * parseFloat(coinPrice)).toFixed(2)} USD
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: isMobile ? "12px" : "24px" }}>
                        {useCompactActions ? (
                            <>
                                <div style={styles.actionSwitcher}>
                                    <button
                                        type="button"
                                        style={styles.actionTab(activeAction === 'deposit')}
                                        onClick={() => setActiveAction('deposit')}
                                    >
                                        Depositar
                                    </button>
                                    <button
                                        type="button"
                                        style={styles.actionTab(activeAction === 'withdraw')}
                                        onClick={() => setActiveAction('withdraw')}
                                    >
                                        Retirar
                                    </button>
                                </div>
                                {activeAction === 'deposit' ? depositSection : withdrawSection}
                            </>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "stretch" }}>
                                {depositSection}
                                {withdrawSection}
                            </div>
                        )}
                    </div>

                    {/* Transactions */}
                    <div className="rounded-2xl" style={styles.section}>
                        <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
                            Transacciones
                        </h2>
                        <CoinTransactions
                            transactions={transactions}
                            chainId={defaultNetworkId}
                            coin={walletId}
                            hideDateOnMobile
                            compactMobile
                            fixedHeight
                            desktopHeight={460}
                            mobileHeight={320}
                        />
                    </div>
                </>
            ) : walletInfo === null ? (
                <div style={styles.section}>
                    <h2 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 600, textAlign: "center", marginBottom: "16px" }}>
                        Crear Billetera {walletId.toUpperCase()}
                    </h2>
                    <div style={{ textAlign: "center", marginBottom: "24px", color: "#9CA3AF" }}>
                        No tienes una billetera para esta moneda
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <button onClick={handleCreateWallet} style={styles.button(true)}>
                            Crear Billetera
                        </button>
                    </div>
                </div>
            ) : null}
            <TransactionToast toast={toast} onClose={dismissToast} />
        </div>
    );
}
