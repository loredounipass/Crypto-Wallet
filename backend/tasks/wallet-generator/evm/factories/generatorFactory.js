const { ethers } = require('ethers');
const getGeneratorFactoryContract = require('../contracts/abis/GeneratorFactoryContract');

class GeneratorFactory {
    constructor(rpc, privateKeys) {
        // Assume first private key
        const privateKey = privateKeys[0];
        this.provider = new ethers.JsonRpcProvider(rpc);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }

    async generate(address, networkId) {
        // networkId must be passed since ethers doesn't automatically load networks from Truffle JSON
        const contract = await getGeneratorFactoryContract(this.wallet, networkId);
        const tx = await contract.generate();
        const receipt = await tx.wait();
        return receipt;
    }
}

module.exports = GeneratorFactory;
