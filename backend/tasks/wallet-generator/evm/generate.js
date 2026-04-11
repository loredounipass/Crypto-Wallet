const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })

// If running locally (outside Docker where CI is not true), override DB to use localhost
if (!process.env.CI) {
    process.env.DB_HOST = '127.0.0.1'
    process.env.DB_PORT = '27020'
}

const { sleep } = require(`${appRoot}/config/utils/lock`)

const connectDB = require(`${appRoot}/config/db/getMongoose`)
const WalletContract = require(`${appRoot}/config/models/WalletContract`)
const GeneratorFactory = require('./factories/generatorFactory')
const { ethers } = require('ethers');

var amount = process.argv[2] || 0
const network = process.argv[3] || 97

const { rpc, g_address_pk, g_address } = require(`${appRoot}/config/chains/${network}`)

connectDB.then(async () => {
    console.log('Loading contract...')
    const generatorFactory = new GeneratorFactory(rpc, [g_address_pk])
    
    const generatorAbi = require('./contracts/abis/GeneratorFactoryContract.json').abi;
    const iface = new ethers.Interface(generatorAbi);

    while (amount > 0) {
        console.log('Generating wallet... ', 'Remain: ', amount - 1)
        const res = await generatorFactory.generate(g_address, network)
        
        let walletAddress = '';
        for (const log of res.logs) {
            try {
                const parsedLog = iface.parseLog({ topics: [...log.topics], data: log.data });
                if (parsedLog && parsedLog.name === 'WalletGenerated') {
                    walletAddress = parsedLog.args[0]; // The wallet address
                    break;
                }
            } catch (e) {}
        }

        console.log(`Saving wallet: ${walletAddress}`)
        const walletContract = new WalletContract({
            address: walletAddress,
            chainId: network
        })
        await walletContract.save()
        amount--
        await sleep(3000)
    }

    process.exit()
})