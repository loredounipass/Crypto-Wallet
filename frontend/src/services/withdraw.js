import { post, withdrawApi, withdrawTokenApi } from '../api/http'

export default class Withdraw {



    // INITIATES A WITHDRAWAL TRANSACTION FOR A NATIVE CRYPTOCURRENCY COIN
    static async process(coin, amount, account) {
        return await post(withdrawApi,
            {
                coin,
                amount: parseFloat(amount),
                to: account
            })
    }




    // INITIATES A WITHDRAWAL TRANSACTION FOR A SPECIFIC ERC20 TOKEN
    static async processToken(tokenAddress, amount, to) {
        return await post(withdrawTokenApi,
            {
                tokenAddress,
                amount: parseFloat(amount),
                to
            })
    }
}