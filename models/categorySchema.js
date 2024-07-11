const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    offerIsActive:{
        type:Boolean,
        default:false
    },
    offerRate:{
        type:Number,
        min:0,
        default:0
    }
}
,
{timestamps:true}
);

module.exports = mongoose.model('Category', categorySchema);
