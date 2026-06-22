import { get, donationsWalletsApi } from "../api/http";

const getWallets = async () => {
    return await get(donationsWalletsApi);
};

const Donations = { getWallets };

export default Donations;