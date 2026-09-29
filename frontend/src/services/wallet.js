import { get, post, walletInfoApi, allWalletInfoApi, walletCreateApi, tokenBalancesApi } from '../api/http'

export default class Wallet {



    // FETCHES THE BALANCE AND INFORMATION FOR A SPECIFIC COIN WALLET
    static async getWalletInfo(walletId) {
        return await get(walletInfoApi,
            {
                coin: walletId
            })
    }




    // FETCHES THE BALANCES AND INFORMATION FOR ALL NATIVE COIN WALLETS
    static async getAllWalletInfo() {
        return await get(allWalletInfoApi)
    }




    // FETCHES THE BALANCES FOR ALL SUPPORTED ERC20 TOKENS
    static async getTokenBalances() {
        return await get(tokenBalancesApi)
    }




    // CREATES A NEW WALLET FOR A SPECIFIC COIN ON THE GIVEN CHAIN
    static async createWallet({ chainId, coin }) {
        return await post(walletCreateApi,
            {
                chainId,
                coin
            })
    }
}