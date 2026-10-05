import React from 'react';
import { getDisplayableTxHash, getStatusName } from '../utils/Display';

const DOT_BY_COIN = (coin) => {
    const c = String(coin || '').toUpperCase();
    if (c === 'USDC') return '#60A5FA';
    if (c === 'USDT') return '#34D399';
    if (c === 'ETH') return '#C084FC';
    return '#60A5FA';
};

const SYMBOL_COLOR = (coin) => {
    const c = String(coin || '').toUpperCase();
    if (c === 'USDC') return '#A78BFA';
    if (c === 'USDT') return '#34D399';
    if (c === 'ETH') return '#C084FC';
    return '#A78BFA';
};

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
                        <th style={styles.th}>Transaction ID</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Status</th>
                        {!shouldHideDate && <th style={styles.thRight || styles.th}>Date</th>}
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction, index) => {
                        const coin = getTransactionCoin(transaction);
                        const dot = DOT_BY_COIN(coin);
                        const badge = styles.statusBadge(transaction.status);
                        return (
                        <tr
                            key={`${transaction.transactionId || transaction.txHash || index}-${index}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleOpen(transaction)}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            {showCoinColumn && (
                                <td style={styles.td}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "999px", backgroundColor: dot, display: "inline-block", flexShrink: 0 }} />
                                        <span style={{ color: "#E5E7EB" }}>{getTransactionSymbol(transaction)}</span>
                                    </div>
                                </td>
                            )}
                            <td style={styles.td}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                                    <span style={{ width: "7px", height: "7px", borderRadius: "999px", backgroundColor: dot, display: "inline-block", flexShrink: 0 }} />
                                    <span style={{ color: "#7FB3F5", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 600, fontSize: isCompact ? "11.5px" : "13px" }}>
                                        {getDisplayableTxHash(transaction.txHash || transaction.linkedTxHash)}
                                    </span>
                                </span>
                            </td>
                            <td style={styles.td}>
                                <span style={{ ...styles.amount(transaction.nature), whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontSize: isCompact ? "12px" : "13.5px" }}>
                                    {transaction.nature === 1 && transaction.status > 1 ? '+' : ''}
                                    {formatAmount(transaction.amount, transaction)}
                                    {' '}
                                    <span style={{ color: SYMBOL_COLOR(coin), fontWeight: 800 }}>
                                        {getTransactionSymbol(transaction)}
                                    </span>
                                </span>
                            </td>
                            <td style={styles.td}>
                                <span style={{
                                    padding: isCompact ? "4px 10px" : "5px 12px",
                                    borderRadius: "999px",
                                    fontSize: isCompact ? "10.5px" : "12px",
                                    fontWeight: 700,
                                    backgroundColor: badge.bg,
                                    color: badge.text,
                                    border: `1px solid ${badge.border || 'transparent'}`,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    whiteSpace: "nowrap",
                                    textAlign: "center"
                                }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "999px", backgroundColor: badge.text, display: "inline-block" }} />
                                    {transaction.status === 2 && transaction.confirmations > 0
                                        ? t('confirmations', { count: transaction.confirmations, total: 12 })
                                        : (transaction.status === 3 ? 'Completed' : t(getStatusName(transaction.status)))}
                                </span>
                            </td>
                            {!shouldHideDate && (
                                <td style={styles.tdRight || styles.td}>
                                    {getRealDate(transaction.created_at)}
                                </td>
                            )}
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
