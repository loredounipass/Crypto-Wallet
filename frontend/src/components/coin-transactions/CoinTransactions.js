import React from 'react';
import useCoinTransactionsLogic from './useCoinTransactionsLogic';
import { CoinTransactionsTable } from './CoinTransactionsTable';
import { CoinTransactionDialog } from './CoinTransactionDialog';

export default function CoinTransactions(props) {
    const {
        transactions,
        title,
        showCoinColumn = false
    } = props;

    const logic = useCoinTransactionsLogic(props);

    if (!transactions || transactions.length === 0) {
        return (
            <div style={logic.styles.container}>
                <div style={logic.styles.titleRow}>
                    <h3 style={logic.styles.title}>{title || logic.t('coins_table_history')}</h3>
                    <span style={logic.styles.countBadge}>{logic.t('coins_movements', { count: 0 })}</span>
                </div>
                <div style={{ textAlign: "center", padding: "34px 20px", color: "#9CA3AF" }}>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>{logic.t('coins_empty')}</div>
                    <div style={{ fontSize: "12px" }}>{logic.t('coins_empty_desc')}</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div style={logic.styles.container}>
                <div style={logic.styles.titleRow}>
                    <h3 style={logic.styles.title}>{title || logic.t('coins_table_history')}</h3>
                    <span style={logic.styles.countBadge}>{logic.t('coins_movements', { count: transactions.length })}</span>
                </div>
                
                <CoinTransactionsTable 
                    transactions={transactions}
                    showCoinColumn={showCoinColumn}
                    shouldHideDate={logic.shouldHideDate}
                    styles={logic.styles}
                    t={logic.t}
                    handleOpen={logic.handleOpen}
                    getTransactionCoin={logic.getTransactionCoin}
                    getTransactionSymbol={logic.getTransactionSymbol}
                    formatAmount={logic.formatAmount}
                    getRealDate={logic.getRealDate}
                    isCompact={logic.isCompact}
                />
            </div>

            <CoinTransactionDialog 
                selectedTransaction={logic.selectedTransaction}
                isMobile={logic.isMobile}
                styles={logic.styles}
                t={logic.t}
                handleClose={logic.handleClose}
                getRealDate={logic.getRealDate}
                getTransactionCoin={logic.getTransactionCoin}
                getTransactionSymbol={logic.getTransactionSymbol}
                formatAmount={logic.formatAmount}
                toSafeNumber={logic.toSafeNumber}
                getSafeFee={logic.getSafeFee}
                getSafeNetworkName={logic.getSafeNetworkName}
                getTransactionExplorerUrl={logic.getTransactionExplorerUrl}
                copied={logic.copied}
                setCopied={logic.setCopied}
                txCopied={logic.txCopied}
                setTxCopied={logic.setTxCopied}
            />
        </>
    );
}
