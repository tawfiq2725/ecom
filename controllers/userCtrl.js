const User = require('../models/userSchema');
const Otp = require('../models/otpSchema')
const nodemailer = require('nodemailer');
require('dotenv').config()

// Page Not Found

const pageNotFound = async (req, res) => {
    try {
        res.render("404")
    } catch (error) {
        console.log(error.message);
    }
}

// Home Page

const getHomePage = async(req,res)=>{
    const locals = {
        title:"Hosssom Online Store"
    }
    try {
        if(req.session.user){

            res.render('index',{title:locals.title,success:"User Success"})
        }
        else{

            res.render('index',{title:locals.title,})
        }
    } catch (error) {
        console.log("Something Wrong"+error);
    }
}

// Login Page

const getLoginPage = async (req, res) => {
    try {
        const locals={
            title:`Login Page`
        }
        if(!req.session.user){

            res.render("user/login",{title:locals.title})
        }
        else{
            res.render('index',{title:locals.title,success:"User Success"})
        }
    }
     catch (error) {
        console.log(error.message);
    }
}
//Go to Signup Page

const getSignupPage = async (req, res) => {
    try {
        const locals={
            title:`Sign Up Page`
        }
        if(!req.session.user){

            res.render("user/signup",{title:locals.title})
        }
        else{
            res.render('index',{title:locals.title,success:"User Success"})
        }
    }
     catch (error) {
        console.log(error.message);
    }
}

// Register New Member

const newUserRegistration = async(req,res)=>{
    try {
        const {email} = req.body;
        const findUser = await User.findOne({email})

        // Check password and Confirm password
        if(req.body.password === req.body.password2){
            // Check Existing Member
            if(!findUser){
                // Random Otp Generate
                const otp = `${Math.floor(1000+Math.random()*9000)}`

                console.log(otp);
                // Nodemailer Setup
                const transporter = nodemailer.createTransport({
                    host:process.env.BREVO_SERVER,
                    port:process.env.BREVO_PORT,
                    secure:false,
                    logger:true,
                    requireTLS:true,
                    auth:{
                        user:process.env.BREVO_MAIL,
                        pass:process.env.BREVO_KEY
                    }
                })

                transporter.verify((err,done)=>{
                    if(err){
                        console.log('SMTP problem'+err)
                    }
                    else{
                        console.log('SMTP connected'+done)
                    }
                })

                // Email Details
                const emailDeatils = await transporter.sendMail
                ({
                    from:process.env.BREVO_MAIL,
                    to:email,
                    subject:"Hossom Shirts Verify Otp",
                    html:`Your OTP is ${otp} , Dont Share for Others and It will automatically expires within 5 minutes !`            
                })
                // Error Handling
                if (emailDeatils) {
                    req.session.userOtp = otp
                    req.session.userData = req.body
                    res.render("verify-otp", { email })
                    console.log("Email sented", info.messageId);
                     // Otp Details
                    const otpdata = new Otp({
                    userId: _id,
                    otp: otp,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + (5 *  60 *  1000),
                            });
                    // Otp to saved   
                    await otpdata.save();
                    res.render('user/verifyotp')
                   
                } else {
                    res.json("email-error")
                }
           

            } else{
                console.log("User already Exist");
                res.render("signup", { message: "User with this email already exists" })
            }
        }else{
            console.log("the confirm pass is not matching");
            res.render("signup", { message: "The confirm pass is not matching" })
        }
       
        
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    pageNotFound,
    getLoginPage,
    getHomePage,
    getSignupPage,
    newUserRegistration
}