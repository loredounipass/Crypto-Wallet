import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { getStatusName } from '../utils/Display';
import { getCoinLogo, getCoinFallbackLogo } from '../utils/Chains';
import { CloseIcon, CopyIcon, CheckIcon } from './CoinTransactionsIcons';

export function CoinTransactionDialog({
    selectedTransaction,
    isMobile,
    styles,
    t,
    handleClose,
    getRealDate,
    getTransactionCoin,
    getTransactionSymbol,
    formatAmount,
    toSafeNumber,
    getSafeFee,
    getSafeNetworkName,
    getTransactionExplorerUrl,
    copied,
    setCopied,
    txCopied,
    setTxCopied
}) {
    if (!selectedTransaction) return null;

    return (
        <div style={styles.dialog} onClick={handleClose}>
            <div style={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? "12px" : "20px" }}>
                    <div style={{ color: "#FFFFFF", fontSize: isMobile ? "16px" : "20px", fontWeight: 600 }}>
                        {selectedTransaction.nature === 1 ? t('deposit_details') : t('withdrawal_details')}
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
                        aria-label={t('close')}
                    >
                        <CloseIcon size={20} color={"#9CA3AF"} />
                    </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "10px" : "16px" }}>
                    <div>
                        <div style={styles.label}>{t('coins_table_status')}</div>
                        <div style={{ ...styles.value, color: styles.statusBadge(selectedTransaction.status).text }}>
                            {t(getStatusName(selectedTransaction.status))}
                        </div>
                    </div>
                    <div>
                        <div style={styles.label}>{t('coins_table_date')}</div>
                        <div style={styles.value}>{getRealDate(selectedTransaction.created_at)}</div>
                    </div>
                    <div>
                        <div style={styles.label}>{t('coins_table_currency')}</div>
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
                            <span style={styles.value}>{getTransactionSymbol(selectedTransaction)}</span>
                        </div>
                    </div>
                    <div>
                        <div style={styles.label}>{t('gross_amount')}</div>
                        <div style={styles.value}>
                            {selectedTransaction.nature === 1 
                                ? formatAmount(selectedTransaction.amount, selectedTransaction)
                                : formatAmount(Math.abs(toSafeNumber(selectedTransaction.amount)), selectedTransaction)} {getTransactionSymbol(selectedTransaction)}
                        </div>
                    </div>
                    {selectedTransaction.nature === 2 && (
                        <div>
                            <div style={styles.label}>{t('fee')}</div>
                            <div style={{ ...styles.value, color: "#F44336" }}>
                                -{getSafeFee(selectedTransaction)} {getTransactionSymbol(selectedTransaction)}
                            </div>
                        </div>
                    )}
                    <div>
                        <div style={styles.label}>{selectedTransaction.nature === 1 ? t('received_amount') : t('net_amount')}</div>
                        <div style={{ ...styles.value, color: selectedTransaction.nature === 1 ? "#4CAF50" : ("#FFFFFF"), fontWeight: 700 }}>
                            {selectedTransaction.nature === 1 
                                ? formatAmount(selectedTransaction.amount, selectedTransaction)
                                : formatAmount(Math.abs(toSafeNumber(selectedTransaction.amount)) - getSafeFee(selectedTransaction), selectedTransaction)} {getTransactionSymbol(selectedTransaction)}
                        </div>
                    </div>
                    <div>
                        <div style={styles.label}>{t('network')}</div>
                        <div style={styles.value}>{getSafeNetworkName(selectedTransaction)}</div>
                    </div>
                </div>

                {selectedTransaction.nature === 2 && (
                    <div style={{ marginTop: "16px" }}>
                        <div style={styles.label}>{t('coins_table_address')}</div>
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

                {(selectedTransaction.txHash || selectedTransaction.linkedTxHash) && (
                    <div style={{ marginTop: "16px" }}>
                        <div style={styles.label}>{t('txid')}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ ...styles.value, fontFamily: "monospace", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                                {`${(selectedTransaction.txHash || selectedTransaction.linkedTxHash).slice(0, 20)}...`}
                            </span>
                            <CopyToClipboard
                                text={selectedTransaction.txHash || selectedTransaction.linkedTxHash}
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

                {(selectedTransaction.txHash || selectedTransaction.linkedTxHash) && getTransactionExplorerUrl(selectedTransaction) && (
                    <div style={{ marginTop: "16px" }}>
                        <div style={styles.label}>{t('explorer')}</div>
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
                            {t('view_in_explorer')}
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
                    {t('close')}
                </button>
            </div>
        </div>
    );
}
