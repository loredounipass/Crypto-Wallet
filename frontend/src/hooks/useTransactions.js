import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Transaction from '../services/transaction';
import { apiOrigin } from '../api/http';

export default function useTransitions(coin) {
    const [transactions, setTransactions] = useState([]);

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

    const upsertTransaction = useCallback((incoming) => {
        if (!incoming || !incoming.transactionId) return;

        const requestedCoin = coin ? String(coin).toLowerCase() : null;
        const incomingCoin = incoming.coin ? String(incoming.coin).toLowerCase() : null;
        if (requestedCoin && incomingCoin && requestedCoin !== incomingCoin) return;

        setTransactions((prev) => {
            const nextTx = {
                ...incoming,
                coin: incoming.coin || coin
            };
            const index = prev.findIndex(
                (tx) => tx.transactionId === nextTx.transactionId
            );

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
            return updated;
        });
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
        getTransactions
    };
}
