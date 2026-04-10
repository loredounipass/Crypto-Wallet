const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Compiling contracts...");
    await hre.run("compile");

    const networkName = hre.network.name;
    const chainId = hre.network.config.chainId;
    console.log(`Deploying to network: ${networkName} (Chain ID: ${chainId})`);

    const GeneratorFactoryContract = await hre.ethers.getContractFactory("GeneratorFactoryContract");
    const factory = await GeneratorFactoryContract.deploy();

    await factory.waitForDeployment();
    const deployedAddress = await factory.getAddress();

    console.log(`GeneratorFactoryContract deployed to: ${deployedAddress}`);

    // Save deployed address into GeneratorFactoryContract.json to mimic Truffle behavior
    const artifactPath = path.join(__dirname, '../contracts/abis/GeneratorFactoryContract.json');
    
    let artifact = {};
    if (fs.existsSync(artifactPath)) {
        artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    } else {
        // Create base structure if not exists
        const compiledArtifact = require('../artifacts/contracts/GeneratorFactoryContract.sol/GeneratorFactoryContract.json');
        artifact = {
            contractName: "GeneratorFactoryContract",
            abi: compiledArtifact.abi,
            networks: {}
        };
    }

    if (!artifact.networks) {
        artifact.networks = {};
    }

    artifact.networks[chainId] = {
        address: deployedAddress,
        transactionHash: factory.deploymentTransaction().hash
    };

    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
    console.log(`Saved deployment info to ${artifactPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
