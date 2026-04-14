import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import Transaction from '../services/transaction';
import { apiOrigin } from '../api/http';

export default function useTransitions(coin) {
    const [transactions, setTransactions] = useState([]);
    const [toast, setToast] = useState(null);
    const notifiedCompletedTxRef = useRef(new Set());

    // Define getTransactions using useCallback to memoize it
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

    useEffect(() => {
        getTransactions();
    }, [getTransactions]); 

    const dismissToast = useCallback(() => {
        setToast(null);
    }, []);

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 4500);

        return () => clearTimeout(timer);
    }, [toast]);

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
                    ? `Deposito completado${normalizedCoin ? ` (${normalizedCoin})` : ''}`
                    : `Retiro completado${normalizedCoin ? ` (${normalizedCoin})` : ''}`
            });
        }
    }, [coin]);

    useEffect(() => {
        const socket = io(`${apiOrigin}/transactions`, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('transactionStatusUpdated', upsertTransaction);

        return () => {
            socket.off('transactionStatusUpdated', upsertTransaction);
            socket.disconnect();
        };
    }, [upsertTransaction]);

    return {
        transactions,
        getTransactions,
        toast,
        dismissToast
    };
}
