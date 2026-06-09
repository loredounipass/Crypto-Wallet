require("@nomicfoundation/hardhat-toolbox");
const fs = require('fs');
const appRoot = require('app-root-path');

// Carregar variáveis de ambiente (adaptado do script original)
require('dotenv').config({ path: `${appRoot}/config/.env` });

// Função para construir redes a partir da pasta chains original
const buildNetworks = () => {
    const networks = {};
    const __dir = `${appRoot}/config/chains`;
    
    if (fs.existsSync(__dir)) {
        const files = fs.readdirSync(__dir);

        files.forEach(file => {
            const info = require(`${__dir}/${file}`);
            const network_id = require('path').parse(file).name;

            networks[info.name] = {
                url: info.rpc || "http://127.0.0.1:8545",
                accounts: info.g_address_pk ? [info.g_address_pk] : [],
                chainId: parseInt(network_id)
            };
        });
    }

    // Configuración para localhost/hardhat
    networks.hardhat = {};

    return networks;
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: buildNetworks(),
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
