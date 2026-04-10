const { ethers } = require('ethers');
const GeneratorFactory = require('./GeneratorFactoryContract.json');

module.exports = async (provider, networkId) => {
    // Load the deployed address for the given networkId
    const networkData = GeneratorFactory.networks[networkId];
    if (!networkData) {
        throw new Error(`Contract not deployed on network ${networkId}`);
    }

    const address = networkData.address;
    const abi = GeneratorFactory.abi;

    // Create contract instance using ethers
    const contract = new ethers.Contract(address, abi, provider);
    return contract;
};
