import React from 'react';
import { Avatar, useMediaQuery, useTheme } from '../ui/material';
import { getDisplayableTxHash, getStatusName } from './utils/Display';
import {
    getCoinDecimalsPlace,
    getCoinFee,
    getCoinLogo,
    getNetworkName,
    getCoinFallbackLogo,
    normalizeCoin
} from './utils/Chains';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useThemeMode } from '../ui/styles';

const TxIconBase = ({ children, size = 16, color = "currentColor" }) => (
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

const CopyIcon = ({ size = 16, color = "currentColor" }) => (
    <TxIconBase size={size} color={color}>
        <rect x="9" y="9" width="10" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </TxIconBase>
);

const CheckIcon = ({ size = 16, color = "currentColor" }) => (
    <TxIconBase size={size} color={color}>
        <path d="M5 12l4 4L19 6" />
    </TxIconBase>
);

const CloseIcon = ({ size = 18, color = "currentColor" }) => (
    <TxIconBase size={size} color={color}>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
    </TxIconBase>
);

export default function CoinTransactions({
    transactions,
    coin,
    chainId,
    title = 'Historial de transacciones',
    showCoinColumn = false,
    hideDateOnMobile = false,
    compactMobile = false
}) {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';
    const shouldHideDate = hideDateOnMobile && isMobile;
    const isCompact = compactMobile && isMobile;
    const [copied, setCopied] = React.useState(false);
    const [txCopied, setTxCopied] = React.useState(false);
    const [selectedTransaction, setSelectedTransaction] = React.useState(null);

    const styles = {
        container: {
            backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
            borderRadius: "16px",
            padding: isCompact ? "12px" : "20px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            overflowX: "auto",
        },
        title: {
            color: isDark ? "#FFFFFF" : "#1A1A2E",
            fontSize: isCompact ? "16px" : "18px",
            fontWeight: 600,
            marginBottom: isCompact ? "10px" : "16px",
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            fontSize: isCompact ? "12px" : "14px",
        },
        th: {
            textAlign: "left",
            padding: isCompact ? "8px 6px" : "12px",
            borderBottom: `2px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontWeight: 600,
        },
        td: {
            padding: isCompact ? "8px 6px" : "12px",
            borderBottom: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            color: isDark ? "#FFFFFF" : "#1A1A2E",
        },
        statusBadge: (status) => {
            const colors = {
                1: { bg: "#FEF3C7", text: "#92400E" },
                2: { bg: "#DBEAFE", text: "#1E40AF" },
                3: { bg: "#D1FAE5", text: "#065F46" },
                4: { bg: "#FEE2E2", text: "#991B1B" },
            };
            return colors[status] || { bg: "#F3F4F6", text: "#6B7280" };
        },
        amount: (nature) => ({
            color: nature === 1 ? "#10B981" : "#EF4444",
            fontWeight: 600,
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
            backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
            maxWidth: "500px",
            width: isMobile ? "96%" : "90%",
            maxHeight: "80vh",
            overflowY: "auto",
        },
        label: {
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontSize: "12px",
            marginBottom: "4px",
        },
        value: {
            color: isDark ? "#FFFFFF" : "#1A1A2E",
            fontSize: "14px",
            fontWeight: 500,
        },
    };

    const getRealDate = (date) => {
        return date?.replace('T', ' ').replace('Z', '').replace(/\.\d+/, "");
    };

    const getTransactionCoin = (transaction) => {
        return normalizeCoin(transaction?.coin || coin || 'coin');
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

    const handleOpen = (transaction) => {
        setSelectedTransaction(transaction);
    };

    const handleClose = () => {
        setSelectedTransaction(null);
    };

    if (!transactions || transactions.length === 0) {
        return (
            <div style={styles.container}>
                <div style={styles.title}>{title}</div>
                <div style={{ textAlign: "center", padding: "40px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                    No hay transacciones todavía
                </div>
            </div>
        );
    }

    return (
        <>
            <div style={styles.container}>
                <div style={styles.title}>{title}</div>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {showCoinColumn && <th style={styles.th}>Moneda</th>}
                            <th style={styles.th}>ID Transaccion</th>
                            <th style={styles.th}>Cantidad</th>
                            <th style={styles.th}>Estado</th>
                            {!shouldHideDate && <th style={styles.th}>Fecha</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction, index) => (
                            <tr 
                                key={`${transaction.txHash}-${index}`}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleOpen(transaction)}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                {showCoinColumn && (
                                    <td style={styles.td}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Avatar
                                                src={getCoinLogo(getTransactionCoin(transaction))}
                                                imgProps={{ onError: (e) => { e.currentTarget.src = getCoinFallbackLogo(getTransactionCoin(transaction)); } }}
                                                style={{ width: 20, height: 20 }}
                                            />
                                            <span>{String(getTransactionCoin(transaction) || '').toUpperCase()}</span>
                                        </div>
                                    </td>
                                )}
                                <td style={styles.td}>
                                    <span style={{ color: "#2186EB" }}>
                                        {getDisplayableTxHash(transaction.txHash)}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.amount(transaction.nature)}>
                                        {transaction.nature === 1 && transaction.status > 1 ? '+' : ''}
                                        {transaction.amount ? parseFloat(transaction.amount).toFixed(getCoinDecimalsPlace(getTransactionCoin(transaction))) : ''}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <span style={{
                                        padding: isCompact ? "3px 8px" : "4px 12px",
                                        borderRadius: "20px",
                                        fontSize: isCompact ? "10px" : "12px",
                                        fontWeight: 500,
                                        backgroundColor: styles.statusBadge(transaction.status).bg,
                                        color: styles.statusBadge(transaction.status).text,
                                    }}>
                                        {transaction.status === 2 && transaction.confirmations > 0 
                                            ? `Confirmacion ${transaction.confirmations}/12` 
                                            : getStatusName(transaction.status)}
                                    </span>
                                </td>
                                {!shouldHideDate && (
                                    <td style={styles.td}>
                                        {getRealDate(transaction.created_at)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dialog */}
            {selectedTransaction && (
                <div style={styles.dialog} onClick={handleClose}>
                    <div style={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? "12px" : "20px" }}>
                            <div style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: isMobile ? "16px" : "20px", fontWeight: 600 }}>
                                Detalles de {selectedTransaction.nature === 1 ? 'Deposito' : 'Retiro'}
                            </div>
                            <button 
                                onClick={handleClose}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: isDark ? "#9CA3AF" : "#6B7280",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                }}
                                aria-label="Cerrar"
                            >
                                <CloseIcon size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "10px" : "16px" }}>
                            <div>
                                <div style={styles.label}>Estado</div>
                                <div style={{ ...styles.value, color: styles.statusBadge(selectedTransaction.status).text }}>
                                    {getStatusName(selectedTransaction.status)}
                                </div>
                            </div>
                            <div>
                                <div style={styles.label}>Fecha</div>
                                <div style={styles.value}>{getRealDate(selectedTransaction.created_at)}</div>
                            </div>
                            <div>
                                <div style={styles.label}>Moneda</div>
                                <div style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    backgroundColor: isDark ? "#0F0F1A" : "#F8FAFC",
                                    border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
                                    borderRadius: "10px",
                                    padding: "6px 10px"
                                }}>
                                    <Avatar 
                                        src={getCoinLogo(getTransactionCoin(selectedTransaction))}
                                        imgProps={{ onError: (e) => { e.currentTarget.src = getCoinFallbackLogo(getTransactionCoin(selectedTransaction)); } }}
                                        style={{ width: isMobile ? 28 : 30, height: isMobile ? 28 : 30 }}
                                    />
                                    <span style={styles.value}>{String(getTransactionCoin(selectedTransaction) || '').toUpperCase()}</span>
                                </div>
                            </div>
                            <div>
                                <div style={styles.label}>Cantidad</div>
                                <div style={styles.value}>
                                    {selectedTransaction.nature === 1 
                                        ? parseFloat(selectedTransaction.amount).toFixed(getCoinDecimalsPlace(getTransactionCoin(selectedTransaction)))
                                        : -1 * parseFloat(Math.abs(selectedTransaction.amount) - getCoinFee(getTransactionCoin(selectedTransaction))).toFixed(getCoinDecimalsPlace(getTransactionCoin(selectedTransaction)))}
                                </div>
                            </div>
                            <div>
                                <div style={styles.label}>Red</div>
                                <div style={styles.value}>{getSafeNetworkName(selectedTransaction)}</div>
                            </div>
                            {selectedTransaction.nature === 2 && (
                                <div>
                                    <div style={styles.label}>Comision</div>
                                    <div style={styles.value}>
                                        {getCoinFee(getTransactionCoin(selectedTransaction))} {String(getTransactionCoin(selectedTransaction) || '').toUpperCase()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedTransaction.nature === 2 && (
                            <div style={{ marginTop: "16px" }}>
                                <div style={styles.label}>Direccion</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ ...styles.value, fontFamily: "monospace", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {selectedTransaction.to}
                                    </span>
                                    <CopyToClipboard
                                        text={selectedTransaction.to}
                                        onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                    >
                                        <button style={{
                                            padding: "8px",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: isDark ? "#2D2D44" : "#F3F4F6",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>
                                            {copied
                                                ? <CheckIcon size={16} color={isDark ? "#A7F3D0" : "#059669"} />
                                                : <CopyIcon size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                            }
                                        </button>
                                    </CopyToClipboard>
                                </div>
                            </div>
                        )}

                        {selectedTransaction.status > 1 && (
                            <div style={{ marginTop: "16px" }}>
                                <div style={styles.label}>TxID</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ ...styles.value, fontFamily: "monospace", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {`${selectedTransaction.txHash.slice(0, 20)}...`}
                                    </span>
                                    <CopyToClipboard
                                        text={selectedTransaction.txHash}
                                        onCopy={() => { setTxCopied(true); setTimeout(() => setTxCopied(false), 2000); }}
                                    >
                                        <button style={{
                                            padding: "8px",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: isDark ? "#2D2D44" : "#F3F4F6",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>
                                            {txCopied
                                                ? <CheckIcon size={16} color={isDark ? "#A7F3D0" : "#059669"} />
                                                : <CopyIcon size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                            }
                                        </button>
                                    </CopyToClipboard>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleClose}
                            style={{
                                width: "100%",
                                marginTop: "24px",
                                padding: "14px",
                                backgroundColor: "#2186EB",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
