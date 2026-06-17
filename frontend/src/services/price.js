import { get } from '../api/http'

export default class Price {
    static async getPrice(coin) {
        return get(`price/${coin}`)
    }
}
