
import Withdraw from '../services/withdraw';

export default function useWithdraw(coin) {
    async function withdraw(amount, account) {
        try {
            const { data } = await Withdraw.process(coin, amount, account)
            if (data && 'data' in data)
                return data.data
            return data;
        } catch (err) {
            throw err;
        }
    }

    async function withdrawToken(tokenAddress, amount, to) {
        try {
            const { data } = await Withdraw.processToken(tokenAddress, amount, to)
            if (data && 'data' in data)
                return data.data
            return data;
        } catch (err) {
            throw err;
        }
    }

    return {
        withdraw,
        withdrawToken
    }
}
