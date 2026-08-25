const mongoose = require('mongoose')
const { Web3 } = require('web3')

const nonceSchema = new mongoose.Schema({
    address: { type: String, required: true, lowercase: true },
    chainId: { type: Number, required: true },
    nonce: { type: Number, required: true, default: 0 },
    lastUsedAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: null }
})
nonceSchema.index({ address: 1, chainId: 1 }, { unique: true })
const NonceV2 = mongoose.models.NonceV2 || mongoose.model('NonceV2', nonceSchema)

class TxManager {


    // OBTIENE Y RESERVA ATOMICAMENTE UN NUMERO DE TRANSACCION UNICO PARA LA DIRECCION ASEGURANDO PROTECCION CONTRA CONDICIONES DE CARRERA
    static async getNonce(web3, address, chainId) {
        const key = address.toLowerCase()
        
        let doc = await NonceV2.findOne({ address: key, chainId })
        
        if (!doc) {
            const chainNonce = Number(await web3.eth.getTransactionCount(address, 'pending'))
            try {
                await NonceV2.updateOne(
                    { address: key, chainId },
                    { $setOnInsert: { nonce: chainNonce, lastSyncedAt: new Date() } },
                    { upsert: true }
                )
            } catch (e) {
            }
        }

        const updatedDoc = await NonceV2.findOneAndUpdate(
            { address: key, chainId },
            { $inc: { nonce: 1 }, $set: { lastUsedAt: new Date() } },
            { returnDocument: 'after' }
        )
        
        return Number(updatedDoc.nonce) - 1
    }



    // REINICIA EL CONTADOR DE TRANSACCIONES ELIMINANDO EL REGISTRO DE LA BASE DE DATOS PARA FORZAR LA SINCRONIZACION
    static async resetNonce(address, chainId) {
        await NonceV2.deleteOne({ address: address.toLowerCase(), chainId })
    }



    // ANALIZA EL MENSAJE DE ERROR Y CLASIFICA LA FALLA PARA DETERMINAR LA ESTRATEGIA DE REINTENTO
    static async classifyFailure(error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('nonce') || msg.includes('replacement transaction underpriced')) return 'NONCE_COLLISION'
        if (msg.includes('revert') || msg.includes('execution reverted')) return 'REVERT'
        if (msg.includes('timeout') || msg.includes('network') || msg.includes('econnrefused') || msg.includes('insufficient funds for gas')) return 'NETWORK'
        if (msg.includes('invalid json rpc')) return 'RPC'
        return 'UNKNOWN'
    }
}

module.exports = TxManager
