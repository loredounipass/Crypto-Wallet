import { defineConfig } from "hardhat/config";
import hardhatToolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Navigate up to backend root to find config
const backendRoot = path.resolve(__dirname, '..', '..', '..');
dotenv.config({ path: path.join(backendRoot, 'config', '.env') });

const chainsDir = path.join(backendRoot, 'config', 'chains');
const networks = {};

if (fs.existsSync(chainsDir)) {
    const files = fs.readdirSync(chainsDir);
    for (const file of files) {
        if (!file.endsWith('.js')) continue;
        const filePath = path.join(chainsDir, file);
        const info = require(filePath);
        const network_id = path.parse(file).name;

        networks[info.name] = {
            type: 'http',
            url: info.rpc || "http://127.0.0.1:8545",
            accounts: info.g_address_pk ? [info.g_address_pk] : [],
            chainId: parseInt(network_id)
        };
    }
}

networks.hardhat = {
    type: 'edr-simulated'
};

export default defineConfig({
  solidity: "0.8.20",
  networks,
  plugins: [hardhatToolbox],
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
});
