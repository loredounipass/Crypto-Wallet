const mongoose = require('mongoose')

const EscrowOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true, index: true },
    sellerEmail: { type: String, required: true, index: true },
    providerEmail: { type: String, required: true, index: true },
    sellerWalletAddress: { type: String, required: true },
    providerWalletAddress: { type: String, required: true },
    coin: { type: String, required: true },
    chainId: { type: Number, required: true },
    amount: { type: Number, required: true },
    fiatAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, required: true, default: 'pending', index: true },
    chatroomId: { type: String },
    escrowTxHash: { type: String },
    releaseTxHash: { type: String },
    buyerConfirmedPayment: { type: Boolean, default: false },
    sellerConfirmedRelease: { type: Boolean, default: false },
    disputeReason: { type: String },
    disputeOpenedBy: { type: String },
    expiresAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('EscrowOrder', EscrowOrderSchema)
