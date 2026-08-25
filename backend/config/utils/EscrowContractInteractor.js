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

        const abiPath = path.join(appRoot.toString(), 'tasks/wallet-generator/evm/contracts/abis/EscrowContract.json')
        if (fs.existsSync(abiPath)) {
            const abiFile = JSON.parse(fs.readFileSync(abiPath, 'utf8'))
            this.abi = abiFile.abi

            if (abiFile.networks && abiFile.networks[chainId]) {
                this.contractAddress = abiFile.networks[chainId].address
            }
        } else {
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



    // CONVIERTE UN IDENTIFICADOR UUID FORMATO STRING EN UN HASH BYTES32 REQUERIDO POR EL CONTRATO INTELIGENTE
    uuidToBytes32(uuid) {
        return keccak256(toUtf8Bytes(uuid))
    }



    // VERIFICA SI EL ERROR RECIBIDO CORRESPONDE A UNA FALLA DE EJECUCION REVERTIDA EN LA MAQUINA VIRTUAL
    _isRevertError(error) {
        const msg = (error.message || error.data?.message || '').toLowerCase()
        return msg.includes('revert') || msg.includes('execution reverted') || msg.includes('always failing transaction')
    }



    // ESTANDARIZA EL FORMATO DE LA CLAVE PRIVADA ASEGURANDO QUE COMIENCE CON EL PREFIJO HEXADECIMAL CORRECTO
    _normalizePrivateKey(privateKey) {
        if (!privateKey) return privateKey
        return privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    }



    // FIRMA Y ENVIA UNA TRANSACCION DESDE UNA BILLETERA ESPECIFICA CALCULANDO AUTOMATICAMENTE EL LIMITE DE GAS NECESARIO
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
            gasLimit = BigInt(gasLimit) * 120n / 100n
        } catch (estimateError) {
            if (this._isRevertError(estimateError)) {
                throw new Error(`[ESCROW-CONTRACT] Contract call would revert: ${estimateError.message}`)
            }
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



    // DELEGA EL ENVIO DE LA TRANSACCION AL METODO INTERNO UTILIZANDO LA CUENTA DEL RELAYER AUTORIZADO
    async _sendTransaction(txData, value = '0') {
        return this._sendTransactionFrom(txData, this.relayerAddress, this.relayerPrivateKey, value)
    }



    // TRANSFIERE FONDOS NATIVOS ENTRE DOS DIRECCIONES DESCONTANDO EL COSTO DEL GAS DEL MONTO TOTAL SI ES NECESARIO
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
            if (this._isRevertError(estimateError)) {
                throw new Error(`[ESCROW-WALLET] Native transfer would revert: ${estimateError.message}`)
            }
            console.warn('[ESCROW-WALLET] Native transfer gas estimation failed, using fallback:', estimateError.message)
            gasLimit = 30000n
        }
        const gasCost = gasPrice * gasLimit
        const senderBalance = BigInt(await this.web3.eth.getBalance(from))
        if (senderBalance <= gasCost) {
            throw new Error(`Insufficient balance in sender wallet: required=${gasCost + BigInt(valueWei)} available=${senderBalance}`)
        }
        let adjustedValue = BigInt(valueWei) - gasCost
        if (senderBalance < gasCost + adjustedValue) {
            adjustedValue = senderBalance - gasCost
            console.warn(`[SEND] Balance insufficient for full transfer. Reducing from ${BigInt(valueWei) - gasCost} to ${adjustedValue} (reserving ${gasCost} for gas)`)
        }
        if (adjustedValue <= 0n) {
            throw new Error(`Amount too small to cover gas: amount=${valueWei} gas=${gasCost}`)
        }
        valueWei = adjustedValue
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



    // CONSULTA Y DEVUELVE EL BALANCE NATIVO ACTUAL DE LA DIRECCION ESPECIFICADA EN LA BLOCKCHAIN
    async getNativeBalance(address) {
        const checksum = this.web3.utils.toChecksumAddress(address)
        return BigInt(await this.web3.eth.getBalance(checksum))
    }



    // CALCULA LA CANTIDAD TOTAL DE FONDOS NECESARIOS INCLUYENDO EL MONTO A TRANSFERIR Y EL COSTO ESTIMADO DEL GAS
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



    // VERIFICA EL SALDO DE LA BILLETERA CUSTODIA Y EJECUTA UNA RECARGA AUTOMATICA SI NO ES SUFICIENTE
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
        const gasPrice_ = BigInt(await this.web3.eth.getGasPrice())
        const gasLimit_ = BigInt(await this.web3.eth.estimateGas({
            from: this.hotWalletAddress,
            to: this.escrowWalletAddress,
            value: '0'
        }).catch(() => 30000n))
        const topupGasCost = gasPrice_ * gasLimit_ * 120n / 100n
        console.log('[ESCROW-WALLET] Insufficient escrow balance, topping up from hot wallet:', {
            orderId,
            requiredWei: requiredWei.toString(),
            escrowBalance: escrowBalance.toString(),
            missingWei: missingWei.toString(),
            topupGasCost: topupGasCost.toString()
        })
        await this.fundEscrowWallet(`topup-${orderId}`, missingWei + topupGasCost)
        const updatedBalance = await this.getNativeBalance(this.escrowWalletAddress)
        const toleranceRequired = requiredWei * 98n / 100n
        if (updatedBalance < toleranceRequired) {
            throw new Error(`Escrow top-up failed: required=${requiredWei} available=${updatedBalance}`)
        }
        return { toppedUp: true, requiredWei, escrowBalance: updatedBalance }
    }



    // SIMULA LA CREACION DE UNA ORDEN EN EL CONTRATO PARA OBTENER EL COSTO EXACTO DEL GAS REQUERIDO
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
            gasLimit = 150000n
        }
        return { gasPrice: gasPrice.toString(), gasLimit: gasLimit.toString() }
    }



    // ESTIMA EL COSTO DE GAS PARA LIBERAR LOS FONDOS RETENIDOS EN EL CONTRATO INTELIGENTE
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
            gasLimit = 80000n
        }
        return { gasPrice: gasPrice.toString(), gasLimit: gasLimit.toString() }
    }



    // DEPOSITA LOS FONDOS EN EL CONTRATO INTELIGENTE CREANDO LA ORDEN OFICIALMENTE EN LA CADENA DE BLOQUES
    async createOrderOnChain(orderId, sellerAddress, providerAddress, amountWei) {
        const orderIdBytes32 = this.uuidToBytes32(orderId)
        const seller = this.web3.utils.toChecksumAddress(sellerAddress)
        const provider = this.web3.utils.toChecksumAddress(providerAddress)
        console.log('[ESCROW-CONTRACT] Creating order on-chain:', {
            orderId, orderIdBytes32: orderIdBytes32.slice(0, 10) + '...',
            seller, provider, amountWei: amountWei.toString()
        })
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



    // MUEVE LOS FONDOS DESDE LA BILLETERA CALIENTE HACIA LA BILLETERA DE CUSTODIA AISLADA
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



    // INTERACTUA CON EL CONTRATO INTELIGENTE PARA LIBERAR LOS FONDOS BLOQUEADOS HACIA EL PROVEEDOR
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



    // TRANSFIERE DIRECTAMENTE LOS FONDOS DESDE LA BILLETERA DE CUSTODIA HACIA LA BILLETERA DEL PROVEEDOR
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



    // ADJUDICA Y ENVIA LOS FONDOS AL PROVEEDOR DESPUES DE RESOLVER UNA DISPUTA A SU FAVOR
    async awardFundsFromEscrowWallet(orderId, providerAddress, amountWei) {
        if (!this.escrowWalletAddress || !this.escrowWalletPrivateKey) {
            throw new Error('Escrow wallet credentials are not configured')
        }
        console.log('[ESCROW-WALLET] Awarding from escrow wallet (dispute resolution):', {
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



    // REEMBOLSA LOS FONDOS AL COMPRADOR MEDIANTE UNA LLAMADA AL CONTRATO INTELIGENTE
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



    // DEVUELVE DIRECTAMENTE EL DINERO AL COMPRADOR DESDE LA BILLETERA DE CUSTODIA OFF-CHAIN
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



    // CAMBIA EL ESTADO DE LA ORDEN EN EL CONTRATO INTELIGENTE MARCADOLA COMO EN DISPUTA
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



    // VALIDA QUE EL CONTRATO INTELIGENTE ESTE DESPLEGADO Y RESPONDA CORRECTAMENTE A LAS CONSULTAS
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
