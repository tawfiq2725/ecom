const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    minPurchaseAmount: {
        type: Number,
        required: true
    },
    discountRate: {
        type: Number,
        required: true
    },
    maxDiscount: {
        type: Number,
        required: true
    },
    usedBy: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    expiryDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
