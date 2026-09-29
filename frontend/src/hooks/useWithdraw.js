
import Withdraw from '../services/withdraw';



// CUSTOM HOOK THAT PROVIDES METHODS FOR PROCESSING NATIVE AND TOKEN WITHDRAWALS
export default function useWithdraw(coin) {



    // PROCESSES A NATIVE CRYPTOCURRENCY WITHDRAWAL TO A GIVEN ACCOUNT
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



    // PROCESSES AN ERC20 TOKEN WITHDRAWAL TO A SPECIFIC DESTINATION ADDRESS
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
