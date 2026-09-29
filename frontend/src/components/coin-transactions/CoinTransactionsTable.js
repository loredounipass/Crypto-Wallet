import React from 'react';
import { getDisplayableTxHash, getStatusName } from '../utils/Display';
import { getCoinLogo, getCoinFallbackLogo } from '../utils/Chains';

export function CoinTransactionsTable({
    transactions,
    showCoinColumn,
    shouldHideDate,
    styles,
    t,
    handleOpen,
    getTransactionCoin,
    getTransactionSymbol,
    formatAmount,
    getRealDate,
    isCompact
}) {
    return (
        <div className="hide-scrollbar" style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        {showCoinColumn && <th style={styles.th}>{t('coins_table_currency')}</th>}
                        <th style={styles.th}>{t('coins_table_txid')}</th>
                        <th style={styles.th}>{t('coins_table_amount')}</th>
                        <th style={styles.th}>{t('coins_table_status')}</th>
                        {!shouldHideDate && <th style={styles.th}>{t('coins_table_date')}</th>}
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction, index) => (
                        <tr 
                            key={`${transaction.transactionId || transaction.txHash || index}-${index}`}
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
                                        <span>{getTransactionSymbol(transaction)}</span>
                                    </div>
                                </td>
                            )}
                            <td style={styles.td}>
                                <span style={{ color: "#2186EB", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>
                                    {getDisplayableTxHash(transaction.txHash || transaction.linkedTxHash)}
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
                                        ? t('confirmations', { count: transaction.confirmations, total: 12 })
                                        : t(getStatusName(transaction.status))}
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
    );
}
