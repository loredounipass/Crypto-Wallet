const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Compiling Escrow contract...");
    await hre.run("compile");

    const networkName = hre.network.name;
    const chainId = hre.network.config.chainId;
    console.log(`Deploying EscrowContract to network: ${networkName} (Chain ID: ${chainId})`);

    const EscrowContract = await hre.ethers.getContractFactory("EscrowContract");
    const escrow = await EscrowContract.deploy();

    await escrow.waitForDeployment();
    const deployedAddress = await escrow.getAddress();

    console.log(`EscrowContract deployed to: ${deployedAddress}`);
    console.log(`Relayer (deployer) address: ${(await hre.ethers.provider.getSigner()).address}`);

    // Save deployed address into EscrowContract.json ABI file
    const artifactPath = path.join(__dirname, '../contracts/abis/EscrowContract.json');

    let artifact = {};
    if (fs.existsSync(artifactPath)) {
        artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    } else {
        // Create base structure from compiled artifact
        const compiledArtifact = require('../artifacts/contracts/EscrowContract.sol/EscrowContract.json');
        artifact = {
            contractName: "EscrowContract",
            abi: compiledArtifact.abi,
            networks: {}
        };
    }

    if (!artifact.networks) {
        artifact.networks = {};
    }

    artifact.networks[chainId] = {
        address: deployedAddress,
        transactionHash: escrow.deploymentTransaction().hash
    };

    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
    console.log(`Saved deployment info to ${artifactPath}`);
    console.log(`\n===================================`);
    console.log(`IMPORTANT: Update your .env files with:`);
    console.log(`ESCROW_CONTRACT_ADDRESS=${deployedAddress}`);
    console.log(`===================================\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
