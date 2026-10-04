import { get, transactionsApi, transactionApi } from '../api/http'

export default class Transaction {



    // FETCHES ALL TRANSACTIONS ACROSS ALL SUPPORTED COINS CONCURRENTLY
    static async getAllTransactions() {
        const supportedCoins = ['bnb', 'avax', 's', 'eth', 'matic', 'op']
        const results = await Promise.allSettled(
            supportedCoins.map((coin) => this.getCoinTransactions(coin))
        )

        const mergedTransactions = []

        results.forEach((result, index) => {
            if (result.status !== 'fulfilled') return

            const coin = supportedCoins[index]
            const transactions = result.value?.data

            if (!Array.isArray(transactions)) return

            transactions.forEach((tx) => {
                mergedTransactions.push({
                    ...tx,
                    coin: tx?.coin || coin
                })
            })
        })

        const uniqueTransactions = Array.from(
            new Map(
                mergedTransactions.map((tx) => [
                    tx.transactionId || `${tx.txHash}-${tx.created_at}`,
                    tx
                ])
            ).values()
        )

        uniqueTransactions.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        return {
            data: uniqueTransactions
        }
    }




    // FETCHES THE TRANSACTION HISTORY FOR A SPECIFIC CRYPTOCURRENCY COIN
    // (SORTED NEWEST-FIRST SO NEW TRANSACTIONS ALWAYS APPEAR ON TOP)
    static async getCoinTransactions(coin) {
        const res = await get(transactionsApi,
            {
                coin
            })
        if (Array.isArray(res?.data)) {
            res.data.sort((a, b) =>
                (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0)
            )
        }
        return res
    }




    // FETCHES THE DETAILED INFORMATION OF A SPECIFIC TRANSACTION BY ITS ID
    static async getTransaction(transactionId) {
        return await get(transactionApi,
            {
                transactionId
            })
    }


}
