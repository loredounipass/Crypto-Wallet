const mongoose = require('mongoose')
const { Schema } = mongoose

const indexerCheckpointScheme = Schema({
    chainId: {
        type: Number,
        required: true
    },
    tokenAddress: {
        type: String,
        required: true
    },
    last_processed_block: {
        type: Number,
        required: true,
        default: 0
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
})

indexerCheckpointScheme.index({ chainId: 1, tokenAddress: 1 }, { unique: true })

module.exports = mongoose.model('IndexerCheckpoint', indexerCheckpointScheme)
