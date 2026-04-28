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
import QRScannerModal from '../components/QRScannerModal';

const ScanIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
        <rect x="7" y="7" width="10" height="10" rx="1"></rect>
    </svg>
);

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

const CheckIcon = ({ size = 20, color = "currentColor" }) => (
    <WalletIconBase size={size} color={color}>
        <path d="M5 12l4 4L19 6" />
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
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);

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
            
            <div style={{ marginBottom: "8px", position: "relative" }}>
                <input 
                    type="text" 
                    value={walletInfo?.address || ''} 
                    readOnly 
                    style={{ 
                        ...styles.input, 
                        fontFamily: "monospace", 
                        paddingRight: "64px", 
                        color: copied ? "#4CAF50" : "#FFFFFF",
                        transition: "color 0.3s ease",
                        borderColor: copied ? "rgba(76, 175, 80, 0.5)" : "#2D2D44"
                    }}
                />
                <CopyToClipboard
                    text={walletInfo?.address || ''}
                    onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                >
                    <button 
                        type="button" 
                        style={{
                            ...styles.inputActionButton,
                            backgroundColor: copied ? "rgba(76, 175, 80, 0.15)" : "rgba(33, 134, 235, 0.1)",
                            border: copied ? "1px solid rgba(76, 175, 80, 0.3)" : "1px solid rgba(33, 134, 235, 0.3)",
                            transition: "all 0.2s ease",
                            minWidth: "48px",
                            height: "36px",
                            padding: "0"
                        }} 
                        onMouseEnter={(e) => {
                            if (!copied) {
                                e.currentTarget.style.backgroundColor = "rgba(33, 134, 235, 0.2)";
                                e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!copied) {
                                e.currentTarget.style.backgroundColor = "rgba(33, 134, 235, 0.1)";
                                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                            }
                        }}
                        aria-label="Copiar dirección"
                        title="Copiar dirección"
                    >
                        {copied ? <CheckIcon size={18} color="#4CAF50" /> : <CopyIcon size={18} color="#2186EB" />}
                    </button>
                </CopyToClipboard>
            </div>
            
            <div style={{ 
                height: "20px", 
                color: "#4CAF50", 
                fontSize: "13px", 
                marginBottom: "16px", 
                opacity: copied ? 1 : 0, 
                transition: "opacity 0.3s ease",
                fontWeight: 500,
                paddingLeft: "4px"
            }}>
                ¡Dirección copiada exitosamente!
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: isMobile ? "8px" : "16px" }}>
                <div 
                    onClick={() => setIsQRModalOpen(true)}
                    style={{ 
                        padding: isMobile ? "10px" : "16px", 
                        backgroundColor: "white", 
                        borderRadius: "16px",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(33, 134, 235, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                    title="Toca para ampliar el código QR"
                >
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
                <div style={{ position: "relative" }}>
                    <input 
                        type="text"
                        value={withdrawAddress}
                        onChange={(e) => { setWithdrawAddress(e.target.value); setError(''); }}
                        placeholder={`Direccion de ${getNetworkName(walletInfo?.chainId || defaultNetworkId)}`}
                        style={{ ...styles.input, paddingRight: "58px" }}
                    />
                    <button type="button" onClick={() => setIsScannerOpen(true)} style={styles.inputActionButton} aria-label="Escanear QR">
                        <ScanIcon size={16} />
                    </button>
                </div>
                
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
            <QRScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={(data) => {
                    // some wallets encode URLs like ethereum:0x..., handle that
                    let address = data;
                    if (data.includes(':')) {
                        const parts = data.split(':');
                        if (parts.length > 1) {
                            address = parts[1];
                        }
                    }
                    if (address.includes('?')) {
                        address = address.split('?')[0];
                    }
                    setWithdrawAddress(address);
                    setError('');
                }} 
            />

            {/* Enlarged QR Modal */}
            {isQRModalOpen && (
                <div 
                    style={{
                        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                        backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        backdropFilter: "blur(4px)",
                        animation: "fadeIn 0.2s ease-out"
                    }}
                    onClick={() => setIsQRModalOpen(false)}
                >
                    <style>
                        {`
                            @keyframes slideUp {
                                from { transform: translateY(50px) scale(0.95); opacity: 0; }
                                to { transform: translateY(0) scale(1); opacity: 1; }
                            }
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                        `}
                    </style>
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "white",
                            padding: isMobile ? "24px" : "32px",
                            borderRadius: "24px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            boxShadow: "0 25px 50px -12px rgba(33, 134, 235, 0.25)",
                            animation: "slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                        }}
                    >
                        <QRCode value={walletInfo?.address || ''} size={isMobile ? 240 : 320} />
                        <div style={{ 
                            marginTop: "24px", 
                            color: "#1A1A2E", 
                            fontWeight: 600, 
                            fontSize: isMobile ? "14px" : "16px", 
                            wordBreak: "break-all", 
                            textAlign: "center", 
                            maxWidth: isMobile ? "240px" : "320px",
                            padding: "12px",
                            backgroundColor: "#F3F4F6",
                            borderRadius: "12px"
                        }}>
                            {walletInfo?.address}
                        </div>
                        <button 
                            onClick={() => setIsQRModalOpen(false)}
                            style={{
                                marginTop: "24px",
                                backgroundColor: "#2186EB",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                padding: "14px 24px",
                                fontWeight: 600,
                                fontSize: "16px",
                                cursor: "pointer",
                                width: "100%",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1A6BBD"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#2186EB"}
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
