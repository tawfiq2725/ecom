const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
       firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      mobile: {
        type: String,
        required: true,
        unique: true
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      isVerified:{
        type: Boolean,
        default:false,
      },
      isBlocked:{
        type:Boolean,
        default:false
      },
      isAdmin:{
        type:Boolean,
        default:false
      }
    }, {
      timestamps: true,
    });

module.exports = mongoose.model('User',userSchema);
