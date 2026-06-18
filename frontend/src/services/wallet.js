import { get, post, walletInfoApi, allWalletInfoApi, walletCreateApi, tokenBalancesApi } from '../api/http'

export default class Wallet {
    static async getWalletInfo(walletId) {
        return await get(walletInfoApi,
            {
                coin: walletId
            })
    }

    static async getAllWalletInfo() {
        return await get(allWalletInfoApi)
    }

    static async getTokenBalances() {
        return await get(tokenBalancesApi)
    }

    static async createWallet({ chainId, coin }) {
        return await post(walletCreateApi,
            {
                chainId,
                coin
            })
    }
}