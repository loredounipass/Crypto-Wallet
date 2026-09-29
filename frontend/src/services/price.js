import { get } from '../api/http'

export default class Price {



    // FETCHES THE LATEST USD PRICE FOR A SPECIFIC CRYPTOCURRENCY COIN
    static async getPrice(coin) {
        return get(`price/${coin}`)
    }
}
