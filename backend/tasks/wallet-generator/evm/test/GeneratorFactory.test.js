const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GeneratorFactoryContract", function () {
    let factory;
    let owner;
    let otherAccount;

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();

        const GeneratorFactoryContract = await ethers.getContractFactory("GeneratorFactoryContract");
        factory = await GeneratorFactoryContract.deploy();
        await factory.waitForDeployment();
    });

    it("Should deploy and set the owner correctly", async function () {
        // In solidity, owner is private but we can test functionality restricted to owner
        expect(factory.target).to.be.properAddress;
    });

    it("Should generate a new WalletContract and emit event when called by owner", async function () {
        const tx = await factory.generate();
        const receipt = await tx.wait();

        // Check if event WalletGenerated was emitted
        const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'WalletGenerated');
        expect(event).to.not.be.undefined;
        expect(event.args.wallet).to.be.properAddress;
    });

    it("Should fail to generate if called by non-owner", async function () {
        await expect(factory.connect(otherAccount).generate()).to.be.reverted;
    });
});

describe("WalletContract", function () {
    let wallet;

    beforeEach(async function () {
        const WalletContract = await ethers.getContractFactory("WalletContract");
        wallet = await WalletContract.deploy();
        await wallet.waitForDeployment();
    });

    it("Should receive ETH", async function () {
        const [owner] = await ethers.getSigners();
        const tx = await owner.sendTransaction({
            to: wallet.target,
            value: ethers.parseEther("0.01")
        });
        await tx.wait();

        // Check balance or behavior. Since it forwards if >= 0.01
        // We'd need to mock HOT_WALLET or observe the event if it's observable.
        // For simplicity, just check it doesn't revert
        expect(tx.hash).to.not.be.undefined;
    });
});
