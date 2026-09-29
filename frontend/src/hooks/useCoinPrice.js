import { useState, useEffect } from 'react';
import Price from '../services/price'



// CUSTOM HOOK TO FETCH AND STORE THE LATEST PRICE OF A SPECIFIED COIN IN USD
export default function useCoinPrice(coin) {
    const [coinPrice, setCoinPrice] = useState(null);



    // EFFECT THAT REQUESTS THE COIN PRICE FROM THE API AND UPDATES THE STATE
    useEffect(() => {
        async function getCoinPrice() {
            try {
                const { data } = await Price.getPrice(coin)
                if (data && 'USD' in data)
                    setCoinPrice(data.USD)
            } catch (err) { }
        }

        getCoinPrice()
    }, [coin])

    return {
        coinPrice
    }
}