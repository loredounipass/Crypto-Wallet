import React from 'react';
import { getDisplayableTxHash, getStatusName } from './utils/Display';
import {
    getCoinDecimalsPlace,
    getCoinFee,
    getCoinLogo,
    getNetworkName,
    getNetworkExplorerBase,
    getCoinFallbackLogo,
    normalizeCoin
} from './utils/Chains';
import CopyToClipboard from 'react-copy-to-clipboard';


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
    compactMobile = false,
    fixedHeight = true,
    desktopHeight = 420,
    mobileHeight = 300
}) {
    const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= 640);
    
    
    const shouldHideDate = hideDateOnMobile && isMobile;
    const isCompact = compactMobile && isMobile;
    const tableHeight = isMobile ? mobileHeight : desktopHeight;
    const [copied, setCopied] = React.useState(false);
    const [txCopied, setTxCopied] = React.useState(false);
    const [selectedTransaction, setSelectedTransaction] = React.useState(null);

    React.useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 640);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

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

    const getTransactionExplorerUrl = (transaction) => {
        const txHash = transaction?.txHash;
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

    if (!transactions || transactions.length === 0) {
        return (
            <div style={styles.container}>
                <div style={styles.titleRow}>
                    <h3 style={styles.title}>{title}</h3>
                    <span style={styles.countBadge}>0 movimientos</span>
                </div>
                <div style={{ textAlign: "center", padding: "34px 20px", color: "#9CA3AF" }}>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>No hay transacciones todavía</div>
                    <div style={{ fontSize: "12px" }}>Cuando lleguen movimientos, aparecerán aquí.</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div style={styles.container}>
                <div style={styles.titleRow}>
                    <h3 style={styles.title}>{title}</h3>
                    <span style={styles.countBadge}>{transactions.length} movimientos</span>
                </div>
                <div className="hide-scrollbar" style={styles.tableWrapper}>
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
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    {showCoinColumn && (
                                        <td style={styles.td}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <img
                                                    src={getCoinLogo(getTransactionCoin(transaction))}
                                                    alt={getTransactionCoin(transaction)}
                                                    onError={(e) => { e.currentTarget.src = getCoinFallbackLogo(getTransactionCoin(transaction)); }}
                                                    style={{ width: 20, height: 20, borderRadius: "999px", objectFit: "cover" }}
                                                />
                                                <span>{String(getTransactionCoin(transaction) || '').toUpperCase()}</span>
                                            </div>
                                        </td>
                                    )}
                                    <td style={styles.td}>
                                        <span style={{ color: "#2186EB", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>
                                            {getDisplayableTxHash(transaction.txHash)}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.amount(transaction.nature), whiteSpace: "nowrap" }}>
                                            {transaction.nature === 1 && transaction.status > 1 ? '+' : ''}
                                            {formatAmount(transaction.amount, transaction)}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{
                                            padding: isCompact ? "4px 8px" : "4px 12px",
                                            borderRadius: "20px",
                                            fontSize: isCompact ? "10px" : "12px",
                                            fontWeight: 600,
                                            backgroundColor: styles.statusBadge(transaction.status).bg,
                                            color: styles.statusBadge(transaction.status).text,
                                            display: "inline-block",
                                            whiteSpace: "nowrap",
                                            textAlign: "center"
                                        }}>
                                            {transaction.status === 2 && transaction.confirmations > 0 
                                                ? (isCompact ? `Conf. ${transaction.confirmations}/12` : `Confirmación ${transaction.confirmations}/12`)
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
            </div>

            {/* Dialog */}
            {selectedTransaction && (
                <div style={styles.dialog} onClick={handleClose}>
                    <div style={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? "12px" : "20px" }}>
                            <div style={{ color: "#FFFFFF", fontSize: isMobile ? "16px" : "20px", fontWeight: 600 }}>
                                Detalles de {selectedTransaction.nature === 1 ? 'Deposito' : 'Retiro'}
                            </div>
                            <button 
                                onClick={handleClose}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#9CA3AF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                }}
                                aria-label="Cerrar"
                            >
                                <CloseIcon size={20} color={"#9CA3AF"} />
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
                                    backgroundColor: "#0F0F1A",
                                    border: `1px solid ${"#2D2D44"}`,
                                    borderRadius: "10px",
                                    padding: "6px 10px"
                                }}>
                                    <img
                                        src={getCoinLogo(getTransactionCoin(selectedTransaction))}
                                        alt={getTransactionCoin(selectedTransaction)}
                                        onError={(e) => { e.currentTarget.src = getCoinFallbackLogo(getTransactionCoin(selectedTransaction)); }}
                                        style={{ width: isMobile ? 28 : 30, height: isMobile ? 28 : 30, borderRadius: "999px", objectFit: "cover" }}
                                    />
                                    <span style={styles.value}>{String(getTransactionCoin(selectedTransaction) || '').toUpperCase()}</span>
                                </div>
                            </div>
                            <div>
                                <div style={styles.label}>Monto Bruto</div>
                                <div style={styles.value}>
                                    {selectedTransaction.nature === 1 
                                        ? formatAmount(selectedTransaction.amount, selectedTransaction)
                                        : formatAmount(Math.abs(toSafeNumber(selectedTransaction.amount)), selectedTransaction)} {String(getTransactionCoin(selectedTransaction) || '').toUpperCase()}
                                </div>
                            </div>
                            {selectedTransaction.nature === 2 && (
                                <div>
                                    <div style={styles.label}>Comision</div>
                                    <div style={{ ...styles.value, color: "#F44336" }}>
                                        -{getSafeFee(selectedTransaction)} {String(getTransactionCoin(selectedTransaction) || '').toUpperCase()}
                                    </div>
                                </div>
                            )}
                            <div>
                                <div style={styles.label}>{selectedTransaction.nature === 1 ? 'Monto Recibido' : 'Monto Neto'}</div>
                                <div style={{ ...styles.value, color: selectedTransaction.nature === 1 ? "#4CAF50" : ("#FFFFFF"), fontWeight: 700 }}>
                                    {selectedTransaction.nature === 1 
                                        ? formatAmount(selectedTransaction.amount, selectedTransaction)
                                        : formatAmount(Math.abs(toSafeNumber(selectedTransaction.amount)) - getSafeFee(selectedTransaction), selectedTransaction)} {String(getTransactionCoin(selectedTransaction) || '').toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <div style={styles.label}>Red</div>
                                <div style={styles.value}>{getSafeNetworkName(selectedTransaction)}</div>
                            </div>
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
                                            backgroundColor: "#2D2D44",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>
                                            {copied
                                                ? <CheckIcon size={16} color={"#A7F3D0"} />
                                                : <CopyIcon size={16} color={"#9CA3AF"} />
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
                                            backgroundColor: "#2D2D44",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>
                                            {txCopied
                                                ? <CheckIcon size={16} color={"#A7F3D0"} />
                                                : <CopyIcon size={16} color={"#9CA3AF"} />
                                            }
                                        </button>
                                    </CopyToClipboard>
                                </div>
                            </div>
                        )}

                        {selectedTransaction.status > 1 && getTransactionExplorerUrl(selectedTransaction) && (
                            <div style={{ marginTop: "16px" }}>
                                <div style={styles.label}>Explorer</div>
                                <a
                                    href={getTransactionExplorerUrl(selectedTransaction)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        ...styles.value,
                                        color: "#2186EB",
                                        textDecoration: "none",
                                        fontWeight: 600,
                                        display: "inline-block"
                                    }}
                                >
                                    Ver en Explorer
                                </a>
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
