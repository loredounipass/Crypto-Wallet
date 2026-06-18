const mongoose = require('mongoose')
const { Schema } = mongoose

const erc20TransactionSchema = Schema({
    eventId: {
        type: String,
        required: true,
        unique: true
    },
    chainId: {
        type: Number,
        required: true
    },
    txHash: {
        type: String,
        required: true
    },
    logIndex: {
        type: Number,
        required: true
    },
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
    amount: {
        type: Number,
        required: true
    },
    amountRaw: {
        type: String,
        default: null
    },
    blockNumber: {
        type: Number,
        required: true
    },
    confirmations: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 1
    },
    ledgerApplied: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

erc20TransactionSchema.index({ chainId: 1, txHash: 1, logIndex: 1 }, { unique: true })

module.exports = mongoose.model('Erc20Transaction', erc20TransactionSchema)
