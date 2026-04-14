import Wallet from '../services/wallet';
import { invalidateWalletsCache } from './useAllWallets';

export default async function createWallet(coinAndChain) {
    try {
        const created = await Wallet.createWallet(coinAndChain)
        if (created && 'data' in created) {
            invalidateWalletsCache();
            const { data } = await Wallet.getWalletInfo(created.data.coin)
            if (data) {
                return data
            }
            if (created.data) {
                return created.data;
            }
        }
    } catch (err) {
        return undefined;
    }
}
