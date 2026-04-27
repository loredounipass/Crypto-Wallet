/**
 * EscrowContractInteractor
 * 
 * Manages all on-chain interactions with the EscrowContract.sol
 * Used by BullMQ workers for:
 *   - Funding orders (locking crypto in escrow contract)
 *   - Releasing funds to provider
 *   - Refunding funds to seller
 *   - Marking disputes on-chain
 * 
 * The relayer wallet (ESCROW_RELAYER_WALLET) is the only address
 * authorized to call contract functions (onlyRelayer modifier).
 */

const appRoot = require('app-root-path')
const { Web3 } = require('web3')
const { keccak256, toUtf8Bytes } = require('ethers')
const fs = require('fs')
const path = require('path')

class EscrowContractInteractor {
    constructor(chainId) {
        const chainConfig = require(`${appRoot}/config/chains/${chainId}`)
        this.web3 = new Web3(chainConfig.rpc)
        this.chainId = chainId
        this.relayerAddress = this.web3.utils.toChecksumAddress(process.env.ESCROW_RELAYER_WALLET)
        this.relayerPrivateKey = process.env.ESCROW_RELAYER_PRIVATE_KEY
        
        this.hotWalletAddress = process.env.WITHDRAW_FROM_WALLET ? this.web3.utils.toChecksumAddress(process.env.WITHDRAW_FROM_WALLET) : null;
        this.hotWalletPrivateKey = process.env.WITHDRAW_FROM_PRIVATE_KEY;
        this.escrowWalletAddress = process.env.ESCROW_WALLET_ADDRESS ? this.web3.utils.toChecksumAddress(process.env.ESCROW_WALLET_ADDRESS) : null
        this.escrowWalletPrivateKey = process.env.ESCROW_WALLET_PRIVATE_KEY

        this.contractAddress = process.env.ESCROW_CONTRACT_ADDRESS

        // Load contract ABI
        const abiPath = path.join(appRoot.toString(), 'tasks/wallet-generator/evm/contracts/abis/EscrowContract.json')
        if (fs.existsSync(abiPath)) {
            const abiFile = JSON.parse(fs.readFileSync(abiPath, 'utf8'))
            this.abi = abiFile.abi

            // Check if deployed on this chain and use that address
            if (abiFile.networks && abiFile.networks[chainId]) {
                this.contractAddress = abiFile.networks[chainId].address
            }
        } else {
            // Fallback: use minimal ABI
            this.abi = [
                { "inputs": [{"name":"orderId","type":"bytes32"},{"name":"seller","type":"address"},{"name":"providerWallet","type":"address"}], "name": "createOrder", "outputs": [], "stateMutability": "payable", "type": "function" },
                { "inputs": [{"name":"orderId","type":"bytes32"}], "name": "releaseFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
                { "inputs": [{"name":"orderId","type":"bytes32"}], "name": "refundFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
                { "inputs": [{"name":"orderId","type":"bytes32"}], "name": "markDisputed", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
                { "inputs": [{"name":"orderId","type":"bytes32"}], "name": "getOrder", "outputs": [{"name":"seller","type":"address"},{"name":"providerWallet","type":"address"},{"name":"amount","type":"uint256"},{"name":"status","type":"uint8"},{"name":"createdAt","type":"uint256"}], "stateMutability": "view", "type": "function" },
                { "inputs": [], "name": "getBalance", "outputs": [{"name":"","type":"uint256"}], "stateMutability": "view", "type": "function" }
            ]
        }

        if (this.contractAddress) {
            this.contract = new this.web3.eth.Contract(this.abi, this.contractAddress)
        }
    }

    /**
     * Convert a UUID string to bytes32 for the smart contract
     * @param {string} uuid - UUID v4 string
     * @returns {string} bytes32 hash
     */
    uuidToBytes32(uuid) {
        return keccak256(toUtf8Bytes(uuid))
    }

    _normalizePrivateKey(privateKey) {
        if (!privateKey) return privateKey
        return privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    }

    /**
     * Sign and send a transaction from the specified wallet
     */
    async _sendTransactionFrom(txData, fromAddress, privateKey, value = '0') {
        if (!this.contractAddress) {
            throw new Error('Escrow contract address is not configured')
        }

        const nonce = await this.web3.eth.getTransactionCount(fromAddress, 'pending')
        const gasPrice = await this.web3.eth.getGasPrice()
        const chainId = await this.web3.eth.getChainId()

        let gasLimit
        try {
            gasLimit = await this.web3.eth.estimateGas({
                from: fromAddress,
                to: this.contractAddress,
                data: txData,
                value: value
            })
            // Add 20% buffer for safety
            gasLimit = BigInt(gasLimit) * 120n / 100n
        } catch (estimateError) {
            console.warn('[ESCROW-CONTRACT] Gas estimation failed, using default:', estimateError.message)
            gasLimit = 200000n
        }

        const transaction = {
            from: fromAddress,
            to: this.contractAddress,
            chainId: chainId,
            nonce: this.web3.utils.toHex(nonce),
            gasPrice: gasPrice.toString(),
            gas: gasLimit.toString(),
            data: txData,
            value: value
        }

        const signedTx = await this.web3.eth.accounts.signTransaction(
            transaction,
            this._normalizePrivateKey(privateKey)
        )

        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    }

    /**
     * Sign and send a transaction from the relayer wallet
     */
    async _sendTransaction(txData, value = '0') {
        return this._sendTransactionFrom(txData, this.relayerAddress, this.relayerPrivateKey, value)
    }

    /**
     * Sign and send a native transfer between two wallets.
     */
    async _sendNativeTransfer(fromAddress, privateKey, toAddress, valueWei) {
        const from = this.web3.utils.toChecksumAddress(fromAddress)
        const to = this.web3.utils.toChecksumAddress(toAddress)
        const nonce = await this.web3.eth.getTransactionCount(from, 'pending')
        const gasPrice = BigInt(await this.web3.eth.getGasPrice())
        const chainId = await this.web3.eth.getChainId()

        let gasLimit
        try {
            gasLimit = BigInt(await this.web3.eth.estimateGas({
                from,
                to,
                value: valueWei.toString()
            }))
            gasLimit = gasLimit * 120n / 100n
        } catch (estimateError) {
            console.warn('[ESCROW-WALLET] Native transfer gas estimation failed, using fallback:', estimateError.message)
            gasLimit = 30000n
        }

        const senderBalance = BigInt(await this.web3.eth.getBalance(from))
        const requiredBalance = BigInt(valueWei) + (gasPrice * gasLimit)
        if (senderBalance < requiredBalance) {
            throw new Error(`Insufficient balance in sender wallet: required=${requiredBalance} available=${senderBalance}`)
        }

        const transaction = {
            from,
            to,
            chainId,
            nonce: this.web3.utils.toHex(nonce),
            gasPrice: gasPrice.toString(),
            gas: gasLimit.toString(),
            value: valueWei.toString()
        }

        const signedTx = await this.web3.eth.accounts.signTransaction(
            transaction,
            this._normalizePrivateKey(privateKey)
        )

        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    }

    async getNativeBalance(address) {
        const checksum = this.web3.utils.toChecksumAddress(address)
        return BigInt(await this.web3.eth.getBalance(checksum))
    }

    async _estimateNativeTransferRequiredWei(fromAddress, toAddress, valueWei) {
        const from = this.web3.utils.toChecksumAddress(fromAddress)
        const to = this.web3.utils.toChecksumAddress(toAddress)
        const gasPrice = BigInt(await this.web3.eth.getGasPrice())

        let gasLimit
        try {
            gasLimit = BigInt(await this.web3.eth.estimateGas({
                from,
                to,
                value: valueWei.toString()
            }))
            gasLimit = gasLimit * 120n / 100n
        } catch (estimateError) {
            console.warn('[ESCROW-WALLET] Required-amount gas estimation failed, using fallback:', estimateError.message)
            gasLimit = 30000n
        }

        return BigInt(valueWei) + (gasPrice * gasLimit)
    }

    /**
     * Ensure escrow wallet has enough native balance to transfer amount + gas.
     * If not enough, top up from hot wallet.
     */
    async ensureEscrowWalletBalanceForTransfer(orderId, toAddress, amountWei) {
        if (!this.escrowWalletAddress) {
            throw new Error('Escrow wallet address is not configured')
        }

        const requiredWei = await this._estimateNativeTransferRequiredWei(
            this.escrowWalletAddress,
            toAddress,
            amountWei
        )
        const escrowBalance = await this.getNativeBalance(this.escrowWalletAddress)

        if (escrowBalance >= requiredWei) {
            return { toppedUp: false, requiredWei, escrowBalance }
        }

        const missingWei = requiredWei - escrowBalance
        console.log('[ESCROW-WALLET] Insufficient escrow balance, topping up from hot wallet:', {
            orderId,
            requiredWei: requiredWei.toString(),
            escrowBalance: escrowBalance.toString(),
            missingWei: missingWei.toString()
        })

        await this.fundEscrowWallet(`topup-${orderId}`, missingWei)

        const updatedBalance = await this.getNativeBalance(this.escrowWalletAddress)
        if (updatedBalance < requiredWei) {
            throw new Error(`Escrow top-up failed: required=${requiredWei} available=${updatedBalance}`)
        }

        return { toppedUp: true, requiredWei, escrowBalance: updatedBalance }
    }

    /**
     * Estimate exact gas cost for creating an order
     */
    async estimateCreateOrderGas(orderId, sellerAddress, providerAddress, amountWei) {
        const orderIdBytes32 = this.uuidToBytes32(orderId)
        const seller = this.web3.utils.toChecksumAddress(sellerAddress)
        const provider = this.web3.utils.toChecksumAddress(providerAddress)

        const txData = this.contract.methods.createOrder(
            orderIdBytes32, seller, provider
        ).encodeABI()

        const gasPrice = await this.web3.eth.getGasPrice()
        
        let gasLimit
        try {
            gasLimit = await this.web3.eth.estimateGas({
                from: this.hotWalletAddress,
                to: this.contractAddress,
                data: txData,
                value: amountWei.toString()
            })
        } catch (err) {
            gasLimit = 150000n // fallback
        }

        return { gasPrice: gasPrice.toString(), gasLimit: gasLimit.toString() }
    }

    /**
     * Estimate exact gas cost for releasing funds
     */
    async estimateReleaseFundsGas(orderId) {
        const orderIdBytes32 = this.uuidToBytes32(orderId)
        const txData = this.contract.methods.releaseFunds(orderIdBytes32).encodeABI()
        
        const gasPrice = await this.web3.eth.getGasPrice()
        
        let gasLimit
        try {
            gasLimit = await this.web3.eth.estimateGas({
                from: this.relayerAddress,
                to: this.contractAddress,
                data: txData
            })
        } catch (err) {
            gasLimit = 80000n // fallback
        }

        return { gasPrice: gasPrice.toString(), gasLimit: gasLimit.toString() }
    }

    /**
     * Create an order on-chain by depositing funds into the escrow contract
     * @param {string} orderId - UUID of the order
     * @param {string} sellerAddress - Seller's wallet address
     * @param {string} providerAddress - Provider's wallet address
     * @param {string} amountWei - Amount in wei to deposit
     * @returns {Object} Transaction receipt
     */
    async createOrderOnChain(orderId, sellerAddress, providerAddress, amountWei) {
        const orderIdBytes32 = this.uuidToBytes32(orderId)
        const seller = this.web3.utils.toChecksumAddress(sellerAddress)
        const provider = this.web3.utils.toChecksumAddress(providerAddress)

        console.log('[ESCROW-CONTRACT] Creating order on-chain:', {
            orderId, orderIdBytes32: orderIdBytes32.slice(0, 10) + '...',
            seller, provider, amountWei: amountWei.toString()
        })

        // Check hot wallet balance (WITHDRAW_FROM_WALLET)
        const hotWalletBalance = BigInt(await this.web3.eth.getBalance(this.hotWalletAddress))
        const requiredAmount = BigInt(amountWei)
        if (hotWalletBalance < requiredAmount) {
            throw new Error(`Insufficient hot wallet balance: required=${requiredAmount} available=${hotWalletBalance}`)
        }

        const txData = this.contract.methods.createOrder(
            orderIdBytes32, seller, provider
        ).encodeABI()

        const receipt = await this._sendTransactionFrom(
            txData,
            this.hotWalletAddress,
            this.hotWalletPrivateKey,
            amountWei.toString()
        )

        console.log('[ESCROW-CONTRACT] Order created on-chain:', {
            orderId, txHash: receipt.transactionHash, status: receipt.status
        })

        return receipt
    }

    /**
     * Move funds from hot wallet to escrow wallet (off-chain escrow custody).
     */
    async fundEscrowWallet(orderId, amountWei) {
        if (!this.hotWalletAddress || !this.hotWalletPrivateKey) {
            throw new Error('Hot wallet credentials are not configured')
        }
        if (!this.escrowWalletAddress || !this.escrowWalletPrivateKey) {
            throw new Error('Escrow wallet credentials are not configured')
        }

        console.log('[ESCROW-WALLET] Funding escrow wallet:', {
            orderId,
            from: this.hotWalletAddress,
            to: this.escrowWalletAddress,
            amountWei: amountWei.toString()
        })

        return this._sendNativeTransfer(
            this.hotWalletAddress,
            this.hotWalletPrivateKey,
            this.escrowWalletAddress,
            amountWei
        )
    }

    /**
     * Release escrowed funds to the provider on-chain
     * @param {string} orderId - UUID of the order
     * @returns {Object} Transaction receipt
     */
    async releaseFundsOnChain(orderId) {
        const orderIdBytes32 = this.uuidToBytes32(orderId)

        console.log('[ESCROW-CONTRACT] Releasing funds on-chain:', { orderId })

        const txData = this.contract.methods.releaseFunds(orderIdBytes32).encodeABI()
        const receipt = await this._sendTransaction(txData)

        console.log('[ESCROW-CONTRACT] Funds released on-chain:', {
            orderId, txHash: receipt.transactionHash, status: receipt.status
        })

        return receipt
    }

    /**
     * Release funds from escrow wallet directly to provider wallet.
     */
    async releaseFundsFromEscrowWallet(orderId, providerAddress, amountWei) {
        if (!this.escrowWalletAddress || !this.escrowWalletPrivateKey) {
            throw new Error('Escrow wallet credentials are not configured')
        }

        console.log('[ESCROW-WALLET] Releasing from escrow wallet:', {
            orderId,
            from: this.escrowWalletAddress,
            to: providerAddress,
            amountWei: amountWei.toString()
        })

        return this._sendNativeTransfer(
            this.escrowWalletAddress,
            this.escrowWalletPrivateKey,
            providerAddress,
            amountWei
        )
    }

    /**
     * Refund escrowed funds to the seller on-chain
     * @param {string} orderId - UUID of the order
     * @returns {Object} Transaction receipt
     */
    async refundFundsOnChain(orderId) {
        const orderIdBytes32 = this.uuidToBytes32(orderId)

        console.log('[ESCROW-CONTRACT] Refunding funds on-chain:', { orderId })

        const txData = this.contract.methods.refundFunds(orderIdBytes32).encodeABI()
        const receipt = await this._sendTransaction(txData)

        console.log('[ESCROW-CONTRACT] Funds refunded on-chain:', {
            orderId, txHash: receipt.transactionHash, status: receipt.status
        })

        return receipt
    }

    /**
     * Refund funds from escrow wallet directly to seller wallet.
     */
    async refundFundsFromEscrowWallet(orderId, sellerAddress, amountWei) {
        if (!this.escrowWalletAddress || !this.escrowWalletPrivateKey) {
            throw new Error('Escrow wallet credentials are not configured')
        }

        console.log('[ESCROW-WALLET] Refunding from escrow wallet:', {
            orderId,
            from: this.escrowWalletAddress,
            to: sellerAddress,
            amountWei: amountWei.toString()
        })

        return this._sendNativeTransfer(
            this.escrowWalletAddress,
            this.escrowWalletPrivateKey,
            sellerAddress,
            amountWei
        )
    }

    /**
     * Mark an order as disputed on-chain
     * @param {string} orderId - UUID of the order
     * @returns {Object} Transaction receipt
     */
    async markDisputedOnChain(orderId) {
        const orderIdBytes32 = this.uuidToBytes32(orderId)

        console.log('[ESCROW-CONTRACT] Marking dispute on-chain:', { orderId })

        const txData = this.contract.methods.markDisputed(orderIdBytes32).encodeABI()
        const receipt = await this._sendTransaction(txData)

        console.log('[ESCROW-CONTRACT] Dispute marked on-chain:', {
            orderId, txHash: receipt.transactionHash
        })

        return receipt
    }

    /**
     * Check if the contract is deployed and accessible
     */
    async isContractAvailable() {
        try {
            if (!this.contractAddress || !this.contract) return false
            const balance = await this.contract.methods.getBalance().call()
            return true
        } catch (e) {
            return false
        }
    }
}

module.exports = EscrowContractInteractor
