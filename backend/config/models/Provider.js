const mongoose = require('mongoose')

const ProviderSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    idNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    streetName: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    photo: { type: String, default: '' },
    isValid: { type: Boolean, default: false },
    paymentMethods: { type: [String], default: [] },
    walletAddress: { type: String, default: '' },
    completedOrders: { type: Number, default: 0 },
    totalTradeVolume: { type: Number, default: 0 },
})

module.exports = mongoose.model('Provider', ProviderSchema)
