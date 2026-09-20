import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Building Escrow contract...");

    // Hardhat 3: ethers is accessed via network connection
    const connection = await hre.network.connect();
    const networkName = connection.networkName;
    const chainId = Number((await connection.ethers.provider.getNetwork()).chainId);
    console.log(`Deploying EscrowContract to network: ${networkName} (Chain ID: ${chainId})`);

    const EscrowContract = await connection.ethers.getContractFactory("EscrowContract");
    
    const escrow = await EscrowContract.deploy();

    await escrow.waitForDeployment();
    const deployedAddress = await escrow.getAddress();

    console.log(`EscrowContract deployed to: ${deployedAddress}`);
    console.log(`Relayer (deployer) address: ${(await connection.ethers.provider.getSigner()).address}`);

    const abiDir = path.join(__dirname, '../contracts/abis');
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }

    const artifactPath = path.join(abiDir, 'EscrowContract.json');

    let artifact = {};
    if (fs.existsSync(artifactPath)) {
        artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    } else {
        const compiledArtifactPath = path.join(__dirname, '../artifacts/contracts/EscrowContract.sol/EscrowContract.json');
        const compiledArtifact = JSON.parse(fs.readFileSync(compiledArtifactPath, 'utf8'));
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
    console.log(`Backend will automatically load this address from the ABI for Chain ID ${chainId}`);
    console.log(`===================================\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
