const mongoose = require('mongoose')
const { Schema } = mongoose

const erc20ForwardExecutionScheme = Schema({
    executionId: {
        type: String,
        required: true,
        unique: true
    },
    chainId: {
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
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    eventIds: [{
        type: String
    }],
    settlement_state: {
        type: String,
        enum: ['PENDING_FORWARD', 'IN_FLIGHT', 'CONFIRMED', 'FAILED'],
        default: 'PENDING_FORWARD'
    },
    tx_state: {
        type: String,
        enum: ['QUEUED', 'BROADCASTED', 'IN_MEMPOOL', 'MINED', 'REPLACED', 'DROPPED'],
        default: 'QUEUED'
    },
    failure_type: {
        type: String,
        enum: ['NONE', 'NETWORK', 'RPC', 'REVERT', 'NONCE_COLLISION', 'LEDGER_DRIFT', 'UNKNOWN'],
        default: 'NONE'
    },
    txHash: {
        type: String,
        default: null
    },
    nonce: {
        type: Number,
        default: null
    },
    forwardLock: {
        type: Boolean,
        default: false
    },
    forwardLockedAt: {
        type: Date,
        default: null
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

module.exports = mongoose.model('Erc20ForwardExecution', erc20ForwardExecutionScheme)
