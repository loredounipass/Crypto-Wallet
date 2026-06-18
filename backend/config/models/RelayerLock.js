const mongoose = require('mongoose')
const { Schema } = mongoose

const relayerLockSchema = Schema({
    relayerAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    chainId: {
        type: Number,
        required: true
    },
    lockActive: {
        type: Boolean,
        default: false
    },
    lockedAt: {
        type: Date,
        default: null
    }
})

relayerLockSchema.index({ relayerAddress: 1, chainId: 1 }, { unique: true })

module.exports = mongoose.model('RelayerLock', relayerLockSchema)
