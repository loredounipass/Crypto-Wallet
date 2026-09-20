import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Building contracts...");

    // Hardhat 3: ethers is accessed via network connection
    const connection = await hre.network.connect();
    const networkName = connection.networkName;
    const chainId = Number((await connection.ethers.provider.getNetwork()).chainId);
    console.log(`Deploying to network: ${networkName} (Chain ID: ${chainId})`);

    const GeneratorFactoryContract = await connection.ethers.getContractFactory("GeneratorFactoryContract");
    
    const factory = await GeneratorFactoryContract.deploy();

    await factory.waitForDeployment();
    const deployedAddress = await factory.getAddress();

    console.log(`GeneratorFactoryContract deployed to: ${deployedAddress}`);

    const abiDir = path.join(__dirname, '../contracts/abis');
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }

    const artifactPath = path.join(abiDir, 'GeneratorFactoryContract.json');

    let artifact = {};
    if (fs.existsSync(artifactPath)) {
        artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    } else {
        const compiledArtifactPath = path.join(__dirname, '../artifacts/contracts/GeneratorFactoryContract.sol/GeneratorFactoryContract.json');
        const compiledArtifact = JSON.parse(fs.readFileSync(compiledArtifactPath, 'utf8'));
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
