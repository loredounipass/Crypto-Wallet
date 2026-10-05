import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import useWalletInfo from '../hooks/useWalletInfo';
import useCoinPrice from '../hooks/useCoinPrice';
import useTokenBalances from '../hooks/useTokenBalances';
import { useParams, useNavigate } from 'react-router-dom';
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
import CoinTransactions from '../components/coin-transactions/CoinTransactions';
import useTransitions from '../hooks/useTransactions';
import { TransactionToast } from '../components/toasts/Toast';
import QRScannerModal from '../components/QRScannerModal';
import { useTranslation } from 'react-i18next';
import { invalidateTokensCache } from '../hooks/useTokenBalances';

const ScanIcon = ({ size = 18, color = "#9CA3AF" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
        <rect x="7" y="7" width="10" height="10" rx="1"></rect>
    </svg>
);

const WalletIconBase = ({ children, size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const BackIcon = ({ size = 16, color = "#CBD5E1" }) => (
    <WalletIconBase size={size} color={color}>
        <path d="M15 18l-6-6 6-6" />
    </WalletIconBase>
);

const CopyIcon = ({ size = 16, color = "#9CA3AF" }) => (
    <WalletIconBase size={size} color={color}>
        <rect x="9" y="9" width="10" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </WalletIconBase>
);

const CheckIcon = ({ size = 16, color = "#4ADE80" }) => (
    <WalletIconBase size={size} color={color}>
        <path d="M5 12l4 4L19 6" />
    </WalletIconBase>
);

const ChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export default function Wallet() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
    const [isTablet, setIsTablet] = useState(() => window.innerWidth <= 1024);
    const [copied, setCopied] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [error, setError] = useState('');
    const [activeAction, setActiveAction] = useState('deposit');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [activeTokenWithdraw, setActiveTokenWithdraw] = useState(null);
    // UI-only: pestaña visual del panel Deposit (no afecta retiros)
    const [depositTab, setDepositTab] = useState('native');

    const { walletId } = useParams();
    const defaultNetworkId = getDefaultNetworkId(walletId);
    const { walletInfo, isWalletLoading, setWalletInfo } = useWalletInfo(walletId);
    const { coinPrice } = useCoinPrice(walletId);
    const { tokenBalances, refreshTokens } = useTokenBalances();
    const { withdraw, withdrawToken } = useWithdraw(walletId);
    const { transactions, getTransactions, toast, dismissToast } = useTransitions(walletId);

    const truncateToDecimals = (num, dec) => {
        const calcDec = Math.pow(10, dec);
        return Math.trunc(num * calcDec) / calcDec;
    };

    const [withdrawLoading, setWithdrawLoading] = useState(false);

    const selectedToken = activeTokenWithdraw && activeTokenWithdraw !== 'native'
        ? tokenBalances.find(t => t.tokenAddress === activeTokenWithdraw)
        : null;

    const coinCode = selectedToken ? selectedToken.tokenSymbol.toLowerCase() : normalizeCoin(walletInfo?.coin || walletId);
    const fee = selectedToken ? 0 : getCoinFee(coinCode);
    const minWithdraw = selectedToken ? 0 : getCoinMinWithdraw(coinCode);
    const balanceNumber = Number(walletInfo?.balance || 0);
    const maxWithdrawable = selectedToken ? selectedToken.availableBalance : balanceNumber;
    const hasInsufficientFunds = selectedToken ? (maxWithdrawable <= 0) : (maxWithdrawable < minWithdraw);

    const isValidAddressForCoin = (address, coin) => {
        const trimmed = String(address || '').trim();
        if (!trimmed) return false;

        // Current supported coins are EVM-based in this UI.
        if (['bnb', 'avax', 'eth', 'matic', 's', 'op', 'usdt', 'usdc'].includes(coin)) {
            return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
        }

        return trimmed.length >= 10;
    };

    const handleWithdraw = async () => {
        if (selectedToken) {
            return handleTokenWithdraw(selectedToken);
        }
        const normalizedAddress = String(withdrawAddress || '').trim();
        const amountNumber = Number(withdrawAmount);

        if (!withdrawAmount || !normalizedAddress) {
            setError(t('wallet_error_invalid_input', 'Ingresa una dirección y cantidad válida.'));
            return;
        }
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            setError(t('wallet_error_invalid_amount', 'Ingresa un monto válido mayor a 0.'));
            return;
        }
        if (!isValidAddressForCoin(normalizedAddress, coinCode)) {
            setError(t('wallet_error_invalid_address_coin', `Dirección inválida para ${coinCode.toUpperCase()}.`));
            return;
        }
        if (amountNumber > maxWithdrawable) {
            setError(t('wallet_error_exceeds_max', `Monto inválido. Máximo disponible: ${maxWithdrawable.toFixed(getCoinDecimalsPlace(coinCode))}`));
            return;
        }
        if (amountNumber <= fee) {
            setError(t('wallet_error_fee_exceeds', `Monto inválido. El monto debe ser mayor a la comisión (${fee} ${coinCode.toUpperCase()})`));
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
                setError(result?.msg || result?.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setWithdrawLoading(false);
        }
    };

    const setMaxAmount = () => {
        setWithdrawAmount(String(truncateToDecimals(maxWithdrawable, getCoinDecimalsPlace(coinCode))));
        setError('');
    };

    const handleTokenWithdraw = async (token) => {
        const normalizedAddress = String(withdrawAddress || '').trim();
        const amountNumber = Number(withdrawAmount || 0);

        if (!normalizedAddress || !/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
            setError(t('token_withdraw') + ': Dirección inválida');
            return;
        }
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            setError(t('token_withdraw') + ': Monto inválido');
            return;
        }
        if (amountNumber > Math.floor(token.availableBalance * 1e8) / 1e8) {
            setError(t('token_withdraw') + ': Saldo insuficiente');
            return;
        }

        setWithdrawLoading(true);
        setError('');
        try {
            const result = await withdrawToken(token.tokenAddress, amountNumber, normalizedAddress);
            if (result === 'success') {
                setWithdrawAddress('');
                setWithdrawAmount('');
                setActiveTokenWithdraw('native');
                setError('');
                invalidateTokensCache();
                refreshTokens();
                getTransactions();
            } else {
                setError(result?.msg || result?.message || t('wallet_error_generic'));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setWithdrawLoading(false);
        }
    };

    const getWithdrawButtonText = () => {
        if (withdrawLoading) return t('wallet_btn_processing', 'Procesando...');
        if (hasInsufficientFunds) return t('wallet_btn_insufficient_funds', 'Fondos Insuficientes');
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return t('wallet_btn_enter_amount', 'Ingresa un monto');
        if (Number(withdrawAmount) <= fee) return t('wallet_btn_amount_gt_fee', 'Monto debe ser > comisión');
        if (Number(withdrawAmount) > maxWithdrawable) return t('wallet_btn_exceeds_max', 'Monto excede máximo');
        if (Number(withdrawAmount) < minWithdraw) return t('wallet_btn_lt_min', 'Monto < mínimo');
        if (!withdrawAddress) return t('wallet_btn_enter_address', 'Ingresa una dirección');
        if (!isValidAddressForCoin(withdrawAddress, coinCode)) return t('wallet_btn_invalid_address', 'Dirección Inválida');
        return 'Preview Withdrawal';
    };

    const canWithdraw = Number.isFinite(Number(withdrawAmount))
        && Number(withdrawAmount) > fee
        && Number(withdrawAmount) <= maxWithdrawable + 0.00000001 // Small tolerance for float
        && Number(withdrawAmount) >= minWithdraw
        && isValidAddressForCoin(withdrawAddress, coinCode)
        && !withdrawLoading
        && !hasInsufficientFunds;

    const [creating, setCreating] = useState(false);

    const handleCreateWallet = async () => {
        if (creating) return;
        setCreating(true);
        try {
            const wallet = await createWallet({
                coin: walletId,
                chainId: defaultNetworkId,
            });
            if (wallet) {
                setWalletInfo(wallet);
            }
        } finally {
            setCreating(false);
        }
    };

    React.useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth <= 640);
            setIsTablet(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ---------- Solo presentación (derivados visuales, sin cambiar lógica) ----------
    const networkName = getNetworkName(walletInfo?.chainId || defaultNetworkId);
    const myTokens = (walletInfo?.address && Array.isArray(tokenBalances))
        ? tokenBalances.filter(t => String(t.walletAddress || '').toLowerCase() === String(walletInfo.address).toLowerCase())
        : [];
    const nativeSym = String(walletInfo?.coin || walletId || 'ETH').toUpperCase();
    const nativeUsd = balanceNumber * Number(coinPrice || 0);
    const tokenUsdOf = (sym, bal) => {
        const s = String(sym || '').toUpperCase();
        if (s === 'USDC' || s === 'USDT') return Number(bal || 0) * 1;
        return 0;
    };
    const totalUsd = nativeUsd + myTokens.reduce((a, tk) => a + tokenUsdOf(tk.tokenSymbol, tk.availableBalance), 0);
    const dotColors = ['#C084FC', '#60A5FA', '#34D399', '#FBBF24', '#F87171'];
    // Mostrar USDC/USDT siempre aunque no haya depósito (placeholder con 0, no afecta retiro)
    const realBySym = {};
    myTokens.forEach(tk => { realBySym[String(tk.tokenSymbol || '').toUpperCase()] = tk; });
    const stableAsset = (sym) => {
        const real = realBySym[sym];
        if (real) return { id: real.tokenAddress, symbol: sym, balance: real.availableBalance, usd: tokenUsdOf(sym, real.availableBalance), isPlaceholder: false };
        return { id: `placeholder-${sym}`, symbol: sym, balance: 0, usd: 0, isPlaceholder: true };
    };
    const otherTokens = myTokens.filter(tk => !['USDC', 'USDT'].includes(String(tk.tokenSymbol || '').toUpperCase()));
    const assets = [
        { id: 'native', symbol: nativeSym, balance: balanceNumber, usd: nativeUsd, isPlaceholder: false },
        ...(nativeSym === 'USDC' || nativeSym === 'USDT' ? [] : [stableAsset('USDC'), stableAsset('USDT')]),
        ...otherTokens.map(tk => ({ id: tk.tokenAddress, symbol: String(tk.tokenSymbol || '').toUpperCase(), balance: tk.availableBalance, usd: tokenUsdOf(tk.tokenSymbol, tk.availableBalance), isPlaceholder: false }))
    ];
    const activeAssetId = activeTokenWithdraw || 'native';
    const fmtBal = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtUsd = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const depositSymbols = assets.map(a => a.symbol).join(', ') || nativeSym;
    const withdrawLabel = selectedToken
        ? `${selectedToken.tokenSymbol.toUpperCase()} (Balance: ${fmtBal(selectedToken.availableBalance)} ${String(selectedToken.tokenSymbol).toUpperCase()} · ${fmtUsd(selectedToken.availableBalance)})`
        : `${nativeSym} (Balance: ${Number(balanceNumber || 0).toFixed(4)} ${nativeSym} · ${fmtUsd(nativeUsd)})`;

    const styles = {
        page: {
            minHeight: "100%",
            width: "100%",
            boxSizing: "border-box",
        },
        container: {
            padding: isMobile ? "12px 12px 32px" : "20px 28px 40px",
            maxWidth: "1080px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
        },
        topbar: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: isMobile ? "14px" : "18px",
        },
        backPill: {
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            cursor: "pointer",
            color: "#CBD5E1",
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 14px",
            borderRadius: "10px",
            background: "#12121E",
            border: "1px solid #232332",
        },
        netBadge: {
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#34D399",
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.28)",
            borderRadius: "999px",
            padding: "6px 14px",
            whiteSpace: "nowrap",
        },
        card: {
            background: "#12121E",
            border: "1px solid #1F1F2E",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        },
        portfolio: {
            background: "#12121E",
            border: "1px solid #1F1F2E",
            borderRadius: "16px",
            padding: isMobile ? "18px 16px" : "24px 26px",
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            alignItems: isTablet ? "stretch" : "center",
            justifyContent: "space-between",
            gap: isMobile ? "18px" : "24px",
            marginBottom: isMobile ? "14px" : "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            boxSizing: "border-box",
        },
        portLabelRow: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "6px",
        },
        portLabel: {
            color: "#9CA3AF",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
        },
        pctChip: {
            fontSize: "11px",
            fontWeight: 700,
            color: "#34D399",
            background: "rgba(52,211,153,0.12)",
            border: "1px solid rgba(52,211,153,0.3)",
            borderRadius: "999px",
            padding: "2px 8px",
        },
        portAmount: {
            color: "#FFFFFF",
            fontSize: isMobile ? "30px" : "38px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
        },
        portActive: {
            color: "#9CA3AF",
            fontSize: "13px",
            marginTop: "8px",
        },
        assetRow: {
            display: "flex",
            gap: "10px",
            flexWrap: isMobile ? "wrap" : "nowrap",
            justifyContent: isTablet ? "flex-start" : "flex-end",
        },
        assetCard: (isActive) => ({
            minWidth: isMobile ? "calc(50% - 5px)" : "118px",
            flex: isMobile ? "1 1 calc(50% - 5px)" : "0 0 auto",
            background: "#1A1A28",
            border: isActive ? "1px solid #A855F7" : "1px solid #2A2A3A",
            borderRadius: "12px",
            padding: "10px 12px",
            cursor: "pointer",
            boxSizing: "border-box",
            boxShadow: isActive ? "0 0 0 1px rgba(168,85,247,0.35), 0 6px 18px rgba(168,85,247,0.15)" : "none",
        }),
        grid2: {
            display: "grid",
            gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr",
            gap: isMobile ? "14px" : "20px",
            alignItems: "stretch",
            marginBottom: isMobile ? "14px" : "20px",
        },
        panel: {
            background: "#12121E",
            border: "1px solid #1F1F2E",
            borderRadius: "16px",
            padding: isMobile ? "18px 16px" : "24px 24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
        },
        panelTitleRow: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "10px",
        },
        panelTitle: { color: "#FFFFFF", fontSize: "18px", fontWeight: 800, margin: 0 },
        tabs: {
            display: "inline-flex",
            background: "#0B0B14",
            border: "1px solid #23232F",
            borderRadius: "10px",
            padding: "3px",
            gap: "2px",
        },
        tab: (isActive) => ({
            border: "none",
            borderRadius: "8px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            background: isActive ? "#7C3AED" : "transparent",
            color: isActive ? "#FFFFFF" : "#9CA3AF",
        }),
        protoBadge: {
            fontSize: "12px",
            fontWeight: 700,
            color: "#C4B5FD",
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.35)",
            borderRadius: "8px",
            padding: "5px 12px",
            whiteSpace: "nowrap",
        },
        subtle: { color: "#9CA3AF", fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" },
        qrWrap: { display: "flex", justifyContent: "center", margin: "6px 0 18px" },
        qrCard: {
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "14px",
            lineHeight: 0,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.6), 0 8px 32px rgba(168,85,247,0.25)",
            cursor: "pointer",
        },
        field: {
            position: "relative",
            marginBottom: "12px",
        },
        input: {
            width: "100%",
            padding: "13px 14px",
            borderRadius: "12px",
            border: "1px solid #23233A",
            backgroundColor: "#0A0A14",
            color: "#E5E7EB",
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box",
        },
        select: {
            width: "100%",
            padding: "13px 36px 13px 14px",
            borderRadius: "12px",
            border: "1px solid #23233A",
            backgroundColor: "#0A0A14",
            color: "#E5E7EB",
            fontSize: "13.5px",
            fontWeight: 600,
            outline: "none",
            boxSizing: "border-box",
            appearance: "none",
            WebkitAppearance: "none",
            cursor: "pointer",
        },
        addrInput: {
            width: "100%",
            padding: "12px 44px 12px 14px",
            borderRadius: "12px",
            border: "1px solid #1F1F2E",
            backgroundColor: "#0A0A14",
            color: "#D1D5DB",
            fontSize: "12.5px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            outline: "none",
            boxSizing: "border-box",
        },
        iconBtn: {
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "9px",
            cursor: "pointer",
        },
        maxChip: {
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            borderRadius: "7px",
            padding: "5px 10px",
            background: "rgba(168,85,247,0.16)",
            color: "#D8B4FE",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
        },
        primaryBtn: (disabled) => ({
            width: "100%",
            border: "none",
            borderRadius: "12px",
            padding: "14px 16px",
            fontSize: "15px",
            fontWeight: 800,
            color: "#FFFFFF",
            cursor: disabled ? "not-allowed" : "pointer",
            background: disabled ? "#23232F" : "linear-gradient(90deg, #A855F7 0%, #6366F1 60%, #3B82F6 100%)",
            opacity: disabled ? 0.7 : 1,
            marginTop: "6px",
            boxShadow: disabled ? "none" : "0 8px 24px rgba(139,92,246,0.35)",
        }),
        hintCenter: { color: "#9CA3AF", fontSize: "12.5px", textAlign: "center", marginTop: "12px" },
        feeRow: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            fontSize: "12.5px",
            marginTop: "14px",
            paddingTop: "14px",
            borderTop: "1px solid #1C1C2A",
        },
        switcher: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            backgroundColor: "#0B0B14",
            border: "1px solid #23232F",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "14px",
            gap: "4px",
        },
        switchTab: (isActive) => ({
            border: "none",
            borderRadius: "9px",
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "13px",
            backgroundColor: isActive ? "#2563EB" : "transparent",
            color: isActive ? "#FFFFFF" : "#9CA3AF",
        }),
    };

    const useCompactActions = isTablet;

    const depositPanel = (
        <div style={styles.panel}>
            <div style={styles.panelTitleRow}>
                <h2 style={styles.panelTitle}>{t('wallet_deposit_title', 'Deposit')}</h2>
                <div style={styles.tabs}>
                    {assets.slice(0, 3).map(a => (
                        <button
                            key={a.id}
                            type="button"
                            style={styles.tab((depositTab === a.id) || (assets.length === 1 && a.id === 'native'))}
                            onClick={() => setDepositTab(a.id)}
                        >
                            {a.symbol}
                        </button>
                    ))}
                    {assets.length === 0 && (
                        <button type="button" style={styles.tab(true)}>{nativeSym}</button>
                    )}
                </div>
            </div>
            <div style={styles.subtle}>
                Your address ({networkName}) accepts {depositSymbols}
            </div>
            <div style={styles.qrWrap}>
                <div style={styles.qrCard} onClick={() => setIsQRModalOpen(true)} title={t('wallet_tap_qr', 'Ampliar QR')}>
                    <QRCode value={walletInfo?.address || ''} size={isMobile ? 168 : 196} />
                </div>
            </div>
            <div style={styles.field}>
                <input type="text" value={walletInfo?.address || ''} readOnly style={styles.addrInput} />
                <CopyToClipboard
                    text={walletInfo?.address || ''}
                    onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                >
                    <button type="button" style={styles.iconBtn} aria-label={t('wallet_copy_address', 'Copiar')}>
                        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                    </button>
                </CopyToClipboard>
            </div>
            <div style={{ height: "18px", color: "#4ADE80", fontSize: "12.5px", opacity: copied ? 1 : 0, transition: "opacity 0.3s", fontWeight: 600 }}>
                {t('wallet_address_copied', 'Dirección copiada')}
            </div>
        </div>
    );

    const withdrawPanel = (
        <div style={styles.panel}>
            <div style={styles.panelTitleRow}>
                <h2 style={styles.panelTitle}>{t('wallet_withdraw_title', 'Withdraw')}</h2>
                <span style={styles.protoBadge}>ERC-20 Protocol</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={styles.field}>
                    <select
                        value={activeTokenWithdraw || 'native'}
                        onChange={(e) => {
                            if (String(e.target.value || '').startsWith('placeholder-')) return;
                            setActiveTokenWithdraw(e.target.value);
                            setWithdrawAmount('');
                            setError('');
                        }}
                        style={styles.select}
                    >
                        <option value="native">{nativeSym} (Balance: {Number(balanceNumber || 0).toFixed(4)} {nativeSym} · {fmtUsd(nativeUsd)})</option>
                        {walletInfo?.address && myTokens.map(token => (
                            <option key={token.tokenAddress} value={token.tokenAddress}>
                                {String(token.tokenSymbol).toUpperCase()} (Balance: {fmtBal(token.availableBalance)} {String(token.tokenSymbol).toUpperCase()} · {fmtUsd(tokenUsdOf(token.tokenSymbol, token.availableBalance))})
                            </option>
                        ))}
                        {nativeSym !== 'USDC' && !realBySym['USDC'] && (
                            <option value="placeholder-USDC" disabled>USDC (Balance: 0.00 USDC · $0.00)</option>
                        )}
                        {nativeSym !== 'USDT' && !realBySym['USDT'] && (
                            <option value="placeholder-USDT" disabled>USDT (Balance: 0.00 USDT · $0.00)</option>
                        )}
                    </select>
                    <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "inline-flex" }}>
                        <ChevronDown />
                    </span>
                </div>
                {/* Texto visual espejo del select (foto) — no altera lógica */}
                <div style={{ display: "none" }}>{withdrawLabel}</div>
                <div style={styles.field}>
                    <input
                        type="text"
                        value={withdrawAddress}
                        onChange={(e) => { setWithdrawAddress(e.target.value); setError(''); }}
                        placeholder="Recipient 0x... address"
                        style={{ ...styles.input, paddingRight: "52px" }}
                    />
                    <button type="button" onClick={() => setIsScannerOpen(true)} style={styles.iconBtn} aria-label={t('wallet_scan_qr', 'Escanear')}>
                        <ScanIcon size={17} />
                    </button>
                </div>
                <div style={styles.field}>
                    <input
                        type="number"
                        value={withdrawAmount || ''}
                        onChange={(e) => { setWithdrawAmount(e.target.value); setError(''); }}
                        placeholder={`Amount (${coinCode.toUpperCase()})`}
                        style={{ ...styles.input, paddingRight: "64px" }}
                    />
                    <button type="button" onClick={setMaxAmount} style={styles.maxChip}>
                        Max
                    </button>
                </div>
                <button
                    onClick={handleWithdraw}
                    disabled={!canWithdraw}
                    style={styles.primaryBtn(!canWithdraw)}
                >
                    {getWithdrawButtonText()}
                </button>
                <div style={styles.hintCenter}>
                    Min withdraw amount: {selectedToken ? `10.00 ${coinCode.toUpperCase()}` : `${minWithdraw.toFixed(2)} ${coinCode.toUpperCase()} · 0.01 ETH`}
                </div>
                {hasInsufficientFunds && (
                    <div style={{ color: "#F87171", fontSize: "13px", fontWeight: 600, textAlign: 'center', marginTop: "6px" }}>
                        {t('wallet_min_withdraw', { amount: minWithdraw, coin: coinCode.toUpperCase() })}
                    </div>
                )}
                {error && <div style={{ color: "#F87171", fontSize: "13px", marginTop: "8px" }}>{error}</div>}
                <div style={styles.feeRow}>
                    <div>
                        <div style={{ color: "#9CA3AF" }}>Network fee: {selectedToken ? `1.50 ${coinCode.toUpperCase()}` : `${fee} ${coinCode.toUpperCase()} (~0.0006 ETH)`}</div>
                        <div style={{ color: "#9CA3AF", marginTop: "4px" }}>Max available: {truncateToDecimals(maxWithdrawable, getCoinDecimalsPlace(coinCode))} {coinCode.toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#34D399", fontWeight: 700 }}>Fast (12 Gwei)</div>
                        <div style={{ color: "#FFFFFF", fontWeight: 800, marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
                            {fmtUsd(selectedToken ? maxWithdrawable : nativeUsd)} USD
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isWalletLoading) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={{ color: "#9CA3AF" }}>{t('wallet_loading', 'Cargando...')}</div>
                    <TransactionToast toast={toast} onClose={dismissToast} />
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.topbar}>
                    <div style={styles.backPill} onClick={() => navigate('/wallets')}>
                        <BackIcon size={14} />
                        <span>Back to Wallets</span>
                    </div>
                    <div style={styles.netBadge}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "999px", backgroundColor: "#34D399", display: "inline-block" }} />
                        {networkName}
                    </div>
                </div>

                {!isWalletLoading && walletInfo ? (
                    <>
                        <div style={styles.portfolio}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: "16px", overflow: "hidden",
                                        background: "#1E1E30", border: "1px solid #2D2D44",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 0 24px rgba(139,92,246,0.35)",
                                    }}>
                                        <img
                                            src={getCoinLogo(walletInfo.coin)}
                                            alt={`${networkName} network`}
                                            title={`${networkName} network`}
                                            onError={(e) => { e.currentTarget.src = getCoinFallbackLogo(walletInfo.coin); }}
                                            style={{ width: "32px", height: "32px", objectFit: "contain" }}
                                        />
                                    </div>
                                    <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "1px", color: "#A78BFA", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                                        {({ s: 'Sonic Network', eth: 'Ethereum Network', bnb: 'BNB Network', avax: 'Avalanche Network', matic: 'Polygon Network', op: 'Optimism Network' })[String(walletInfo.coin || '').toLowerCase()] || `${nativeSym} Network`}
                                    </span>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={styles.portLabelRow}>
                                        <span style={styles.portLabel}>Total Portfolio Value</span>
                                        <span style={styles.pctChip}>+2.4%</span>
                                    </div>
                                    <div style={styles.portAmount}>
                                        {fmtUsd(totalUsd || (balanceNumber * Number(coinPrice || 0)))}
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#9CA3AF", marginLeft: "8px", letterSpacing: "0.5px" }}>USD</span>
                                    </div>
                                    <div style={styles.portActive}>Active Network: {String(walletInfo.coin || '').toLowerCase() === 'eth' ? `${networkName} (ERC-20)` : networkName}</div>
                                </div>
                            </div>
                            <div style={styles.assetRow}>
                                {assets.slice(0, 4).map((a, idx) => {
                                    const isActive = (activeAssetId === a.id);
                                    return (
                                        <div
                                            key={a.id + idx}
                                            style={{ ...styles.assetCard(isActive), opacity: a.isPlaceholder ? 0.85 : 1, cursor: a.isPlaceholder ? "default" : "pointer" }}
                                            onClick={() => {
                                                if (a.isPlaceholder) return;
                                                setActiveTokenWithdraw(a.id === 'native' ? 'native' : a.id);
                                                setWithdrawAmount('');
                                                setError('');
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                                    <img
                                                        src={getCoinLogo(a.symbol)}
                                                        alt={a.symbol}
                                                        onError={(e) => { e.currentTarget.src = getCoinFallbackLogo(a.symbol); }}
                                                        style={{ width: 18, height: 18, borderRadius: "999px", objectFit: "cover", display: "block" }}
                                                    />
                                                    <span style={{ color: "#C4B5FD", fontSize: "11px", fontWeight: 800, letterSpacing: "0.4px" }}>{a.symbol}</span>
                                                </span>
                                                <span style={{ width: "8px", height: "8px", borderRadius: "999px", backgroundColor: dotColors[idx % dotColors.length] }} />
                                            </div>
                                            <div style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 800, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                                                {a.id === 'native'
                                                    ? Number(a.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    : fmtBal(a.balance)}
                                            </div>
                                            <div style={{ color: "#8B8DA3", fontSize: "12px", marginTop: "3px", fontVariantNumeric: "tabular-nums" }}>{fmtUsd(a.usd)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ marginBottom: "0" }}>
                            {useCompactActions ? (
                                <>
                                    <div style={styles.switcher}>
                                        <button type="button" style={styles.switchTab(activeAction === 'deposit')} onClick={() => setActiveAction('deposit')}>
                                            {t('wallet_deposit_tab', 'Deposit')}
                                        </button>
                                        <button type="button" style={styles.switchTab(activeAction === 'withdraw')} onClick={() => setActiveAction('withdraw')}>
                                            {t('wallet_withdraw_tab', 'Withdraw')}
                                        </button>
                                    </div>
                                    <div style={{ marginBottom: isMobile ? "14px" : "20px" }}>
                                        {activeAction === 'deposit' ? depositPanel : withdrawPanel}
                                    </div>
                                </>
                            ) : (
                                <div style={styles.grid2}>
                                    {depositPanel}
                                    {withdrawPanel}
                                </div>
                            )}
                        </div>

                        <CoinTransactions
                            transactions={transactions}
                            chainId={defaultNetworkId}
                            coin={walletId}
                            hideDateOnMobile
                            compactMobile
                            fixedHeight
                            desktopHeight={390}
                            mobileHeight={270}
                        />
                    </>
                ) : walletInfo === null ? (
                    <div style={styles.panel}>
                        <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "12px" }}>
                            {t('wallet_create_title', { coin: walletId.toUpperCase() })}
                        </h2>
                        <div style={{ textAlign: "center", marginBottom: "16px", color: "#9CA3AF" }}>
                            {t('wallet_no_wallet', 'No tienes wallet aún')}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <button onClick={handleCreateWallet} disabled={creating} style={styles.primaryBtn(creating)}>
                                {creating ? t('wallet_creating', 'Creando...') : t('wallet_create_btn', 'Crear')}
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

                {isQRModalOpen && (
                    <div
                        style={{
                            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                            backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            backdropFilter: "blur(4px)",
                        }}
                        onClick={() => setIsQRModalOpen(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: "#12121E",
                                padding: isMobile ? "24px" : "32px",
                                borderRadius: "20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                border: "1px solid #2D2D44",
                                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
                                position: "relative",
                                maxWidth: "92vw",
                                boxSizing: "border-box",
                            }}
                        >
                            <button
                                onClick={() => setIsQRModalOpen(false)}
                                style={{
                                    position: "absolute", top: "12px", right: "12px",
                                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "50%", width: "32px", height: "32px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: "#9CA3AF", fontSize: "16px",
                                }}
                            >
                                ✕
                            </button>
                            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "14px", lineHeight: 0 }}>
                                <QRCode value={walletInfo?.address || ''} size={isMobile ? 240 : 300} />
                            </div>
                            <div style={{
                                marginTop: "18px", width: "100%", background: "rgba(0,0,0,0.3)",
                                border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px",
                                padding: "12px 14px", boxSizing: "border-box",
                                fontFamily: "monospace", fontSize: "12px", color: "#D1D5DB",
                                wordBreak: "break-all", textAlign: "center", lineHeight: 1.6,
                            }}>
                                {walletInfo?.address}
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(walletInfo?.address || '');
                                    setIsQRModalOpen(false);
                                }}
                                style={styles.primaryBtn(false)}
                            >
                                {t('wallet_copy_address', 'Copiar dirección')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
