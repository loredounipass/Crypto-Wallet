import { get, transactionsApi, transactionApi } from '../api/http'

export default class Transaction {
    static async getAllTransactions() {
        const supportedCoins = ['bnb', 'avax', 'ftm', 'eth', 'matic', 'op']
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

    static async getCoinTransactions(coin) {
        return await get(transactionsApi,
            {
                coin
            })
    }

    static async getTransaction(transactionId) {
        return await get(transactionApi,
            {
                transactionId
            })
    }


}
