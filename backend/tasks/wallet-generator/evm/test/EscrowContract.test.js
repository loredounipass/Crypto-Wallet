const assert = require("assert");
const { ethers } = require("hardhat");

describe("EscrowContract", function () {
    let escrow;
    let relayer, seller, provider, other;

    beforeEach(async function () {
        [relayer, seller, provider, other] = await ethers.getSigners();

        const EscrowContract = await ethers.getContractFactory("EscrowContract");
        escrow = await EscrowContract.connect(relayer).deploy();
        await escrow.waitForDeployment();
    });

    describe("Deployment", function () {
        it("should set the deployer as relayer", async function () {
            assert.strictEqual(await escrow.relayer(), relayer.address);
        });

        it("should have zero balance initially", async function () {
            assert.strictEqual(await escrow.getBalance(), 0n);
        });
    });

    describe("createOrder", function () {
        const orderId = ethers.keccak256(ethers.toUtf8Bytes("test-order-001"));
        const depositAmount = ethers.parseEther("1.0");

        it("should create an order correctly", async function () {
            await escrow.createOrder(orderId, seller.address, provider.address, { value: depositAmount });

            const order = await escrow.getOrder(orderId);
            assert.strictEqual(order.seller, seller.address);
            assert.strictEqual(order.providerWallet, provider.address);
            assert.strictEqual(order.amount, depositAmount);
            assert.strictEqual(order.status, 0n); // FUNDED
        });

        it("should lock funds in the contract", async function () {
            await escrow.createOrder(orderId, seller.address, provider.address, { value: depositAmount });
            assert.strictEqual(await escrow.getBalance(), depositAmount);
        });

        it("should revert if no value sent", async function () {
            try {
                await escrow.createOrder(orderId, seller.address, provider.address, { value: 0 });
                assert.fail("Should have reverted");
            } catch (err) {
                assert.ok(err.message.includes("No value sent"), `Unexpected error: ${err.message}`);
            }
        });

        it("should revert if order already exists", async function () {
            await escrow.createOrder(orderId, seller.address, provider.address, { value: depositAmount });
            try {
                await escrow.createOrder(orderId, seller.address, provider.address, { value: depositAmount });
                assert.fail("Should have reverted");
            } catch (err) {
                assert.ok(err.message.includes("Order already exists"), `Unexpected error: ${err.message}`);
            }
        });

        it("should revert if called by non-relayer", async function () {
            try {
                await escrow.connect(other).createOrder(orderId, seller.address, provider.address, { value: depositAmount });
                assert.fail("Should have reverted");
            } catch (err) {
                assert.ok(err.message.includes("Only relayer"), `Unexpected error: ${err.message}`);
            }
        });
    });

    describe("releaseFunds", function () {
        const orderId = ethers.keccak256(ethers.toUtf8Bytes("release-test-001"));
        const depositAmount = ethers.parseEther("2.0");

        beforeEach(async function () {
            await escrow.createOrder(orderId, seller.address, provider.address, { value: depositAmount });
        });

        it("should release funds to provider", async function () {
            const providerBalanceBefore = await ethers.provider.getBalance(provider.address);

            await escrow.releaseFunds(orderId);

            const providerBalanceAfter = await ethers.provider.getBalance(provider.address);
            assert.strictEqual(providerBalanceAfter - providerBalanceBefore, depositAmount);

            const order = await escrow.getOrder(orderId);
            assert.strictEqual(order.status, 1n); // RELEASED
        });

        it("should empty the contract balance after release", async function () {
            await escrow.releaseFunds(orderId);
            assert.strictEqual(await escrow.getBalance(), 0n);
        });

        it("should revert if order is not funded", async function () {
            await escrow.releaseFunds(orderId); // first release
            try {
                await escrow.releaseFunds(orderId); // second release
                assert.fail("Should have reverted");
            } catch (err) {
                assert.ok(err.message.includes("Order not in funded state"));
            }
        });

        it("should revert if called by non-relayer", async function () {
            try {
                await escrow.connect(other).releaseFunds(orderId);
                assert.fail("Should have reverted");
            } catch (err) {
                assert.ok(err.message.includes("Only relayer"));
            }
        });
    });

    describe("refundFunds", function () {
        const orderId = ethers.keccak256(ethers.toUtf8Bytes("refund-test-001"));
        const depositAmount = ethers.parseEther("1.5");

        beforeEach(async function () {
            await escrow.createOrder(orderId, seller.address, provider.address, { value: depositAmount });
        });

        it("should refund funds to seller", async function () {
            const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

            await escrow.refundFunds(orderId);

            const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
            assert.strictEqual(sellerBalanceAfter - sellerBalanceBefore, depositAmount);

            const order = await escrow.getOrder(orderId);
            assert.strictEqual(order.status, 2n); // REFUNDED
        });

        it("should refund disputed orders", async function () {
            await escrow.markDisputed(orderId);
            await escrow.refundFunds(orderId); // should not throw
            const order = await escrow.getOrder(orderId);
            assert.strictEqual(order.status, 2n);
        });

        it("should revert if order is already released", async function () {
            await escrow.releaseFunds(orderId);
            try {
                await escrow.refundFunds(orderId);
                assert.fail("Should have reverted");
            } catch (err) {
                assert.ok(err.message.includes("Cannot refund in current state"));
            }
        });
    });

    describe("markDisputed", function () {
        const orderId = ethers.keccak256(ethers.toUtf8Bytes("dispute-test-001"));
        const depositAmount = ethers.parseEther("1.0");

        beforeEach(async function () {
            await escrow.createOrder(orderId, seller.address, provider.address, { value: depositAmount });
        });

        it("should mark order as disputed", async function () {
            await escrow.markDisputed(orderId);
            const order = await escrow.getOrder(orderId);
            assert.strictEqual(order.status, 3n); // DISPUTED
        });

        it("should keep funds locked during dispute", async function () {
            await escrow.markDisputed(orderId);
            assert.strictEqual(await escrow.getBalance(), depositAmount);
        });

        it("should revert for non-funded orders", async function () {
            await escrow.releaseFunds(orderId);
            try {
                await escrow.markDisputed(orderId);
                assert.fail("Should have reverted");
            } catch (err) {
                assert.ok(err.message.includes("Can only dispute funded orders"));
            }
        });
    });

    describe("Full lifecycle", function () {
        it("should handle create -> release lifecycle", async function () {
            const orderId = ethers.keccak256(ethers.toUtf8Bytes("lifecycle-1"));
            const amount = ethers.parseEther("3.0");

            await escrow.createOrder(orderId, seller.address, provider.address, { value: amount });
            let order = await escrow.getOrder(orderId);
            assert.strictEqual(order.status, 0n);

            await escrow.releaseFunds(orderId);
            order = await escrow.getOrder(orderId);
            assert.strictEqual(order.status, 1n);
        });

        it("should handle create -> dispute -> refund lifecycle", async function () {
            const orderId = ethers.keccak256(ethers.toUtf8Bytes("lifecycle-2"));
            const amount = ethers.parseEther("2.0");

            await escrow.createOrder(orderId, seller.address, provider.address, { value: amount });
            await escrow.markDisputed(orderId);

            let order = await escrow.getOrder(orderId);
            assert.strictEqual(order.status, 3n);

            await escrow.refundFunds(orderId);
            order = await escrow.getOrder(orderId);
            assert.strictEqual(order.status, 2n);
        });

        it("should handle multiple concurrent orders", async function () {
            const ids = [
                ethers.keccak256(ethers.toUtf8Bytes("multi-1")),
                ethers.keccak256(ethers.toUtf8Bytes("multi-2")),
                ethers.keccak256(ethers.toUtf8Bytes("multi-3")),
            ];
            const amount = ethers.parseEther("1.0");

            for (const id of ids) {
                await escrow.createOrder(id, seller.address, provider.address, { value: amount });
            }

            assert.strictEqual(await escrow.getBalance(), ethers.parseEther("3.0"));

            await escrow.releaseFunds(ids[0]);
            await escrow.refundFunds(ids[1]);

            assert.strictEqual(await escrow.getBalance(), ethers.parseEther("1.0"));

            const order3 = await escrow.getOrder(ids[2]);
            assert.strictEqual(order3.status, 0n); // Still funded
        });
    });
});
