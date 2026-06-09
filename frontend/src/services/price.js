import { getExternal, priceApi } from '../api/http'

const COINGECKO_IDS = {
    bnb: 'binancecoin',
    avax: 'avalanche-2',
    ftm: 'fantom',
    eth: 'ethereum',
    matic: 'matic-network',
    op: 'optimism',
}

function getId(coin) {
    const key = String(coin || '').trim().toLowerCase()
    return COINGECKO_IDS[key] || key
}

export default class Wallet {
    static async getPrice(coin) {
        const id = getId(coin)
        const response = await getExternal(`${priceApi}${id}`)
        if (response.data && response.data[id] && response.data[id].usd != null) {
            response.data = { USD: response.data[id].usd }
        }
        return response
    }
}
