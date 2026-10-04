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
            background: "linear-gradient(180deg, #151529 0%, #10101C 100%)",
            borderRadius: "18px",
            padding: isCompact ? "12px" : "20px",
            border: `1px solid ${"#2D2D44"}`,
            overflow: "hidden",
            boxShadow: "0 14px 28px rgba(0,0,0,0.28)",
        },
        tableWrapper: {
            overflowY: fixedHeight ? "auto" : "visible",
            overflowX: "auto",
            maxHeight: fixedHeight ? `${tableHeight}px` : "none",
            borderRadius: "12px",
            border: `1px solid ${"#232338"}`,
            backgroundColor: "#121224",
        },
        titleRow: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: isCompact ? "10px" : "14px",
        },
        title: {
            color: "#FFFFFF",
            fontSize: isCompact ? "16px" : "19px",
            fontWeight: 700,
            margin: 0,
        },
        countBadge: {
            padding: isCompact ? "3px 8px" : "4px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#BFDBFE",
            backgroundColor: "rgba(37,99,235,0.2)",
            border: `1px solid ${"#1D4ED8"}`,
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            fontSize: isCompact ? "12px" : "14px",
        },
        th: {
            textAlign: "left",
            padding: isCompact ? "8px 6px" : "12px",
            borderBottom: `2px solid ${"#2D2D44"}`,
            color: "#9CA3AF",
            fontWeight: 700,
            fontSize: isCompact ? "10px" : "11px",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            position: "sticky",
            top: 0,
            backgroundColor: "#121224",
            zIndex: 2,
        },
        td: {
            padding: isCompact ? "8px 6px" : "12px",
            borderBottom: `1px solid ${"#2D2D44"}`,
            color: "#FFFFFF",
        },
        statusBadge: (status) => {
            const colors = {
                1: { bg: "#FEF3C7", text: "#92400E" },
                2: { bg: "#DBEAFE", text: "#1E40AF" },
                3: { bg: "#D1FAE5", text: "#065F46" },
                4: { bg: "#FEE2E2", text: "#991B1B" },
                5: { bg: "#FEE2E2", text: "#991B1B" }, // Broadcast failed
            };
            return colors[status] || { bg: "#F3F4F6", text: "#6B7280" };
        },
        amount: (nature) => ({
            color: nature === 1 ? "#10B981" : "#EF4444",
            fontWeight: 700,
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
        const decimals = getCoinDecimalsPlace(getTransactionCoin(transaction));
        return toSafeNumber(value).toFixed(decimals);
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
