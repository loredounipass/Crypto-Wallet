const mongoose = require('mongoose')
const { Schema } = mongoose

const erc20LedgerSchema = Schema({
    walletAddress: {
        type: String,
        required: true,
        index: true
    },
    tokenAddress: {
        type: String,
        required: true,
        index: true
    },
    chainId: {
        type: Number,
        required: true
    },
    available_balance: {
        type: Number,
        required: true,
        default: 0
    },
    locked_for_forward: {
        type: Number,
        required: true,
        default: 0
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    aggregatorLock: {
        type: Boolean,
        default: false
    },
    aggregatorLockedAt: {
        type: Date,
        default: null
    },
    aggregatorState: {
        type: String,
        enum: ['IDLE', 'COLLECTING', 'DISPATCHING'],
        default: 'IDLE'
    },
    forwarded_total: {
        type: Number,
        default: 0
    }
})

erc20LedgerSchema.index({ chainId: 1, walletAddress: 1, tokenAddress: 1 }, { unique: true })

module.exports = mongoose.model('Erc20Ledger', erc20LedgerSchema)
