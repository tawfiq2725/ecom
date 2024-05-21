const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const otpSchema = new mongoose.Schema({
    userId:{
        type:ObjectId,
        ref:"User",
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
    },
    expiresAt: {
        type: Date,
        expires:  300, //  300 seconds =  5 minutes
        default: Date.now,
    },

},
    {timestamps:true}
)

module.exports = mongoose.model('Otp',otpSchema);