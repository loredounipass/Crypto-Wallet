import { post, withdrawApi, withdrawTokenApi } from '../api/http'

export default class Withdraw {
    static async process(coin, amount, account) {
        return await post(withdrawApi,
            {
                coin,
                amount: parseFloat(amount),
                to: account
            })
    }

    static async processToken(tokenAddress, amount, to) {
        return await post(withdrawTokenApi,
            {
                tokenAddress,
                amount: parseFloat(amount),
                to
            })
    }
}