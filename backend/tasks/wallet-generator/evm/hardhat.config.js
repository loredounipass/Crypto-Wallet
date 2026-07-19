import "@nomicfoundation/hardhat-toolbox";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import appRoot from 'app-root-path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

import('dotenv').then(dotenv => dotenv.config({ path: `${appRoot}/config/.env` }));

const buildNetworks = () => {
    const networks = {};
    const __dir = `${appRoot}/config/chains`;
    
    if (fs.existsSync(__dir)) {
        const files = fs.readdirSync(__dir);

        files.forEach(file => {
            const info = require(`${__dir}/${file}`);
            const network_id = path.parse(file).name;

            networks[info.name] = {
                url: info.rpc || "http://127.0.0.1:8545",
                accounts: info.g_address_pk ? [info.g_address_pk] : [],
                chainId: parseInt(network_id)
            };
        });
    }

    networks.hardhat = {};

    return networks;
};

export default {
  solidity: "0.8.20",
  networks: buildNetworks(),
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
