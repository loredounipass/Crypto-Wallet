
import Withdraw from '../services/withdraw';

export default function useWithdraw(coin) {
    async function withdraw(amount, account) {
        try {
            console.log('[useWithdraw] Calling withdraw API:', { coin, amount, account });
            const { data } = await Withdraw.process(coin, amount, account)
            console.log('[useWithdraw] API response:', data);
            if (data && 'data' in data)
                return data.data
            return data;
        } catch (err) {
            console.error('[useWithdraw] API error:', err.response?.data || err.message);
            throw err;
        }
    }

    return {
        withdraw
    }
}