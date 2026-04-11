const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const { Queue } = require(`${appRoot}/config/bullmq`)
const { Web3 } = require('web3')
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { v4: uuidv4 } = require('uuid')

const connectDB = require(`${appRoot}/config/db/getMongoose`)

const getWeb3WssInstance = (wss) => {
    console.log('getWeb3WssInstance called with wss:', wss);
    const web3 = new Web3(wss);
    if (web3.currentProvider && typeof web3.currentProvider.on === 'function') {
        web3.currentProvider.on('error', (e) => {
            console.error('Web3 provider error:', e.message || e);
        });
        web3.currentProvider.on('end', (e) => {
            console.error('Web3 provider connection ended:', e.message || e);
        });
    }
    return web3;
}

module.exports = {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
}