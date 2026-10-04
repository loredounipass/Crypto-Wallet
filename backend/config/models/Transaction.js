const mongoose = require('mongoose')

const transactionScheme = mongoose.Schema({
    nature: {
        type: Number,
        required: true,
        index: true
    },
    txHash: {
        type: String,
        index: true,
        sparse: true,
        validate: {
            validator: function(v) {
                return v === null || v === undefined || /^0x[a-fA-F0-9]{64}$/.test(v) || /^(internal|offchain)-/.test(v);
            },
            message: 'txHash must be a valid Ethereum tx hash (0x + 64 hex chars) or internal marker'
        }
    },
    linkedTxHash: {
        type: String,
        required: false,
        index: true
    },
    amount: Number,
    fee: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now
    },
    to: String,
    tokenSymbol: {
        type: String,
        required: false
    },
    confirmations: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        required: false,
        default: 1,
        index: true
    } //0. Pending Broadcast, 1. Broadcasting, 2. Procesando, 3. Procesado, 4. Cancelado, 5. Broadcast Failed
})

// INDICE UNICO COMPUESTO: impide 2 docs con igual {txHash, nature} (bug duplicacion
// P2P 2026-10-04). Parcial: solo aplica a txHash string, ignora docs sin hash.
transactionScheme.index(
    { txHash: 1, nature: 1 },
    { unique: true, partialFilterExpression: { txHash: { $type: 'string' } } }
)

module.exports = mongoose.model('Transaction', transactionScheme)