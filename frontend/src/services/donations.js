import { get, donationsWalletsApi } from "../api/http";




// FETCHES THE LIST OF DONATION WALLETS FROM THE SERVER
const getWallets = async () => {
    return await get(donationsWalletsApi);
};

const Donations = { getWallets };

export default Donations;