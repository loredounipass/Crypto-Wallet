import { getExternal, priceApi } from '../api/http'

export default class Wallet {
    static async getPrice(coin) {
        return await getExternal(`${priceApi}${coin.toUpperCase()}`)
    }
}
