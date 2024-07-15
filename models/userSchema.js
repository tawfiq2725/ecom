const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstname: {
        type: String,
        required: [true, 'First name is required'],
    },
    lastname: {
        type: String,
        required: [true, 'Last name is required'],
    },
    mobile: {
        type: String,
        required: false,
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    googleId: {
        type: String,
        required: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    wallet: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet' // Reference to the Wallet document
    },
    referralCode: {
        type: String,
        unique: true
    },
    referredBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    referrals: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEligibleForReferralReward: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

userSchema.virtual('fullName').get(function() {
    return `${this.firstname} ${this.lastname}`;
});

module.exports = mongoose.model('User', userSchema);
