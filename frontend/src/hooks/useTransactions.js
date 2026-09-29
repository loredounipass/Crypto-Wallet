import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import i18n from '../languages/i18n';
import Transaction from '../services/transaction';




// CUSTOM HOOK TO MANAGE TRANSACTION HISTORY AND REAL-TIME STATUS UPDATES VIA WEBSOCKETS
export default function useTransitions(coin) {
    const [transactions, setTransactions] = useState([]);
    const [toast, setToast] = useState(null);
    const notifiedCompletedTxRef = useRef(null);
    if (!notifiedCompletedTxRef.current) {
        notifiedCompletedTxRef.current = new Set();
    }
    const upsertTransactionRef = useRef(null);




    // FETCHES THE INITIAL LIST OF TRANSACTIONS FOR A SPECIFIC COIN OR ALL COINS
    const getTransactions = useCallback(async () => {
        try {
            let { data } = coin ? await Transaction.getCoinTransactions(coin)
                : await Transaction.getAllTransactions();

            if (data) {
                setTransactions(data);
            }
        } catch (err) {
            
        }
    }, [coin]); 




    // EFFECT THAT TRIGGERS THE INITIAL TRANSACTION LOAD
    useEffect(() => {
        getTransactions();
    }, [getTransactions]); 




    // CLEARS THE CURRENT TRANSACTION NOTIFICATION TOAST
    const dismissToast = useCallback(() => {
        setToast(null);
    }, []);




    // EFFECT THAT AUTOMATICALLY DISMISSES THE NOTIFICATION TOAST AFTER A DELAY
    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 4500);

        return () => clearTimeout(timer);
    }, [toast]);




    // PROCESSES INCOMING SOCKET EVENTS TO UPDATE OR PREPEND A TRANSACTION AND TRIGGERS NOTIFICATIONS
    const upsertTransaction = useCallback((incoming) => {
        if (!incoming || !incoming.transactionId) return;

        const requestedCoin = coin ? String(coin).toLowerCase() : null;
        const incomingCoin = incoming.coin ? String(incoming.coin).toLowerCase() : null;
        if (requestedCoin && incomingCoin && requestedCoin !== incomingCoin) return;

        let completedTxToNotify = null;
        setTransactions((prev) => {
            const nextTx = {
                ...incoming,
                coin: incoming.coin || coin
            };
            const index = prev.findIndex(
                (tx) => tx.transactionId === nextTx.transactionId
            );
            nextTx.created_at = incoming.created_at || (index >= 0 ? prev[index].created_at : new Date().toISOString());
            
            const previousStatus = index >= 0 ? Number(prev[index]?.status) : null;

            let updated;
            if (index >= 0) {
                updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    ...nextTx
                };
            } else {
                updated = [nextTx, ...prev];
            }

            updated.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const isNowCompleted = Number(nextTx.status) === 3;
            const wasCompleted = previousStatus === 3;
            const alreadyNotified = notifiedCompletedTxRef.current.has(nextTx.transactionId);
            if (isNowCompleted && !wasCompleted && !alreadyNotified) {
                notifiedCompletedTxRef.current.add(nextTx.transactionId);
                completedTxToNotify = index >= 0 ? updated[index] : nextTx;
            }

            return updated;
        });

        if (completedTxToNotify) {
            const isDeposit = Number(completedTxToNotify.nature) === 1;
            const normalizedCoin = String(completedTxToNotify.coin || coin || '').toUpperCase();
            setToast({
                id: `${completedTxToNotify.transactionId}-${Date.now()}`,
                kind: isDeposit ? 'deposit' : 'withdraw',
                message: isDeposit
                    ? `${i18n.t('tx_deposit_completed')}${normalizedCoin ? ` (${normalizedCoin})` : ''}`
                    : `${i18n.t('tx_withdraw_completed')}${normalizedCoin ? ` (${normalizedCoin})` : ''}`
            });
        }
    }, [coin]);

    upsertTransactionRef.current = upsertTransaction;

    const getTransactionsRef = useRef(getTransactions);
    getTransactionsRef.current = getTransactions;




    // EFFECT THAT ESTABLISHES THE WEBSOCKET CONNECTION FOR LIVE TRANSACTION STATUS UPDATES
    useEffect(() => {
        const socket = io(`${new URL(process.env.REACT_APP_API_BASE_URL).origin}/transactions`, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        // Re-fetch when socket connects to close the window of missed events
        socket.on('connect', () => {
            getTransactionsRef.current();
        });

        const handler = (data) => upsertTransactionRef.current(data);
        socket.on('transactionStatusUpdated', handler);

        return () => {
            socket.off('transactionStatusUpdated', handler);
            socket.disconnect();
        };
    }, []);

    return {
        transactions,
        getTransactions,
        toast,
        dismissToast
    };
}
