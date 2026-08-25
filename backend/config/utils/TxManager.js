const mongoose = require('mongoose')
const { Web3 } = require('web3')

const nonceSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true, lowercase: true },
    nonce: { type: Number, required: true, default: 0 }
})
const Nonce = mongoose.models.Nonce || mongoose.model('Nonce', nonceSchema)

class TxManager {


    // OBTIENE Y RESERVA ATOMICAMENTE UN NUMERO DE TRANSACCION UNICO PARA LA DIRECCION ESPECIFICADA
    static async getNonce(web3, address) {
        const key = address.toLowerCase()
        const doc = await Nonce.findOneAndUpdate(
            { address: key },
            { $inc: { nonce: 1 } },
            { new: true, upsert: true }
        )
        if (doc.nonce === 1) {
            const chainNonce = await web3.eth.getTransactionCount(address, 'pending')
            await Nonce.updateOne({ address: key }, { $set: { nonce: chainNonce + 1 } })
            return Number(chainNonce)
        }
        return Number(doc.nonce) - 1
    }



    // REINICIA EL CONTADOR DE TRANSACCIONES ELIMINANDO EL REGISTRO DE LA BASE DE DATOS PARA FORZAR LA SINCRONIZACION
    static async resetNonce(address) {
        await Nonce.deleteOne({ address: address.toLowerCase() })
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
