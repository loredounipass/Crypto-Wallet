import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    getCoinDecimalsPlace,
    getCoinFee,
    getNetworkName,
    getNetworkExplorerBase,
    normalizeCoin
} from '../utils/Chains';

export default function useCoinTransactionsLogic({
    coin,
    chainId,
    hideDateOnMobile,
    compactMobile,
    fixedHeight,
    desktopHeight,
    mobileHeight
}) {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
    const [copied, setCopied] = useState(false);
    const [txCopied, setTxCopied] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 640);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const shouldHideDate = hideDateOnMobile && isMobile;
    const isCompact = compactMobile && isMobile;
    const tableHeight = isMobile ? mobileHeight : desktopHeight;

    const styles = {
        container: {
            background: "#12121E",
            borderRadius: "16px",
            padding: isCompact ? "16px 14px" : "24px 24px 12px",
            border: "1px solid #1F1F2E",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        },
        tableWrapper: {
            overflowY: fixedHeight ? "auto" : "visible",
            overflowX: "auto",
            maxHeight: fixedHeight ? `${tableHeight}px` : "none",
            borderRadius: "0",
            border: "none",
            backgroundColor: "transparent",
        },
        titleRow: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: isCompact ? "12px" : "18px",
        },
        title: {
            color: "#FFFFFF",
            fontSize: isCompact ? "16px" : "18px",
            fontWeight: 800,
            margin: 0,
        },
        countBadge: {
            padding: isCompact ? "4px 10px" : "5px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#C4B5FD",
            backgroundColor: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.35)",
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            fontSize: isCompact ? "12px" : "13.5px",
        },
        th: {
            textAlign: "left",
            padding: isCompact ? "10px 8px" : "10px 12px 14px",
            borderBottom: "1px solid #1E1E2E",
            color: "#7A7A90",
            fontWeight: 700,
            fontSize: isCompact ? "10px" : "11px",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            position: "sticky",
            top: 0,
            backgroundColor: "#12121E",
            zIndex: 2,
            whiteSpace: "nowrap",
        },
        thRight: {
            textAlign: "right",
            padding: isCompact ? "10px 8px" : "10px 12px 14px",
            borderBottom: "1px solid #1E1E2E",
            color: "#7A7A90",
            fontWeight: 700,
            fontSize: isCompact ? "10px" : "11px",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            position: "sticky",
            top: 0,
            backgroundColor: "#12121E",
            zIndex: 2,
            whiteSpace: "nowrap",
        },
        td: {
            padding: isCompact ? "12px 8px" : "15px 12px",
            borderBottom: "1px solid #1C1C2A",
            color: "#FFFFFF",
        },
        tdRight: {
            padding: isCompact ? "12px 8px" : "15px 12px",
            borderBottom: "1px solid #1C1C2A",
            color: "#9CA3AF",
            textAlign: "right",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "12.5px",
            whiteSpace: "nowrap",
        },
        statusBadge: (status) => {
            // Solo presentación estilo foto: pill verde Completed
            if (status === 3) return { bg: "rgba(52,211,153,0.12)", text: "#34D399", border: "rgba(52,211,153,0.30)" };
            const colors = {
                1: { bg: "rgba(251,191,36,0.12)", text: "#FBBF24", border: "rgba(251,191,36,0.30)" },
                2: { bg: "rgba(96,165,250,0.12)", text: "#60A5FA", border: "rgba(96,165,250,0.30)" },
                3: { bg: "rgba(52,211,153,0.12)", text: "#34D399", border: "rgba(52,211,153,0.30)" },
                4: { bg: "rgba(248,113,113,0.12)", text: "#F87171", border: "rgba(248,113,113,0.30)" },
                5: { bg: "rgba(248,113,113,0.12)", text: "#F87171", border: "rgba(248,113,113,0.30)" },
            };
            return colors[status] || { bg: "rgba(156,163,175,0.12)", text: "#9CA3AF", border: "rgba(156,163,175,0.30)" };
        },
        amount: (nature) => ({
            color: nature === 1 ? "#34D399" : "#F87171",
            fontWeight: 800,
        }),
        dialog: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
        },
        dialogContent: {
            backgroundColor: "#1A1A2E",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
            maxWidth: "500px",
            width: isMobile ? "96%" : "90%",
            maxHeight: "80vh",
            overflowY: "auto",
        },
        label: {
            color: "#9CA3AF",
            fontSize: "12px",
            marginBottom: "4px",
        },
        value: {
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 500,
        },
    };

    // CONVIERTE FECHA UTC DE LA DB A HORA LOCAL DEL USUARIO EN FORMATO YYYY-MM-DD HH:mm:ss
    const getRealDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return String(date);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const getTransactionCoin = (transaction) => {
        return normalizeCoin(transaction?.coin || coin || 'coin');
    };

    const getTransactionSymbol = (transaction) => {
        if (transaction?.tokenSymbol) return transaction.tokenSymbol;
        return String(getTransactionCoin(transaction)).toUpperCase();
    };

    const getTransactionChainId = (transaction) => {
        return transaction?.chainId || transaction?.chain_id || chainId;
    };

    const getSafeNetworkName = (transaction) => {
        const txChainId = getTransactionChainId(transaction);
        if (!txChainId) return '-';

        try {
            return getNetworkName(txChainId);
        } catch (error) {
            return '-';
        }
    };

    const getTransactionExplorerUrl = (transaction) => {
        const txHash = transaction?.txHash || transaction?.linkedTxHash;
        const txChainId = getTransactionChainId(transaction);
        if (!txHash || !txChainId) return '';

        const base = getNetworkExplorerBase(txChainId);
        if (!base) return '';

        return `${base}${txHash}`;
    };

    const toSafeNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatAmount = (value, transaction) => {
        // Usa los decimales del token real (ej. USDC=6) y no los de la red (ej. S=18),
        // luego recorta ceros sobrantes para mostrar el valor tal como está en DB.
        const sym = transaction?.tokenSymbol
            ? String(transaction.tokenSymbol)
            : getTransactionCoin(transaction);
        const decimals = getCoinDecimalsPlace(sym);
        const fixed = toSafeNumber(value).toFixed(decimals);
        if (!fixed.includes('.')) return fixed;
        const trimmed = fixed.replace(/\.?0+$/, '');
        return trimmed === '' || trimmed === '-' ? '0' : trimmed;
    };

    const getSafeFee = (transaction) => {
        const parsed = Number(transaction?.fee);
        return Number.isFinite(parsed) ? parsed : getCoinFee(getTransactionCoin(transaction));
    };

    const handleOpen = (transaction) => {
        setSelectedTransaction(transaction);
    };

    const handleClose = () => {
        setSelectedTransaction(null);
    };

    return {
        t,
        isMobile,
        shouldHideDate,
        isCompact,
        tableHeight,
        copied,
        setCopied,
        txCopied,
        setTxCopied,
        selectedTransaction,
        styles,
        getRealDate,
        getTransactionCoin,
        getTransactionSymbol,
        getTransactionChainId,
        getSafeNetworkName,
        getTransactionExplorerUrl,
        toSafeNumber,
        formatAmount,
        getSafeFee,
        handleOpen,
        handleClose
    };
}
