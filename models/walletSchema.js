const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Wallet schema
const WalletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Each user has only one wallet
    },
    balance: {
        type: Number,
        default: 0, // Initial balance is zero
        required: true
    },
    transactions: [{
        type: Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
}, {
    timestamps: true // Automatically add createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Wallet', WalletSchema);
