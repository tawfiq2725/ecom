const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    mainImage: {
        type: String,
        required: true,
    },
    subImages: [{
        type: String,
    }],
    status: {
        type: Boolean,
        default: true,
    },
    highlights: {
        type: [String],
    },
    offerStatus: {
        type: Boolean,
        default: false
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    offerPrice: {
        type: Number,
        min: 0,
        default: 0
    },
    variants: [variantSchema]
},
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
