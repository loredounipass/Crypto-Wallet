import { get } from '../api/http'

export default class Price {



    // FETCHES THE LATEST USD PRICE FOR A SPECIFIC CRYPTOCURRENCY COIN
    static async getPrice(coin) {
        return get(`price/${encodeURIComponent(coin)}`)
    }



    // FETCHES THE LAST 24 HOURS OF PRICE POINTS FOR THE CHART
    static async getChart(coin) {
        return get(`price/${encodeURIComponent(coin)}/chart`)
    }



    // FETCHES THE HIGHLIGHTED COINS FOR THE LANDING PAGE
    static async getLanding() {
        return get('price/landing')
    }
}
