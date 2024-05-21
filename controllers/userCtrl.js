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
const newUserRegistration = async (req, res) => {
    try {
        const { firstname, lastname, mobile, email, password, password2 } = req.body;
        
        // Check if the passwords match
        if (password !== password2) {
            console.log("The confirm password does not match.");
            return res.render("signup", { message: "The confirm password does not match." });
        }

        // Check if the user already exists
        const findUser = await User.findOne({ email });
        if (findUser) {
            console.log("User already exists.");
            return res.render("signup", { message: "User with this email already exists." });
        }

        // Create and save the new user
        const newUser = new User({
            firstname,
            lastname,
            mobile,
            email,
            password,
            isBlocked: false,
            isVerified: false,
            isAdmin: false
        });

        const savedUser = await newUser.save();
        console.log("User saved:", savedUser);

        // Generate and save OTP
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("Generated OTP:", otp);

        const otpData = new Otp({
            userId: savedUser._id,  // Use the saved user's ID
            otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + (5 * 60 * 1000)  // 5 minutes
        });

        await otpData.save();
        console.log("OTP saved:", otpData);

        // Send OTP via email
        const transporter = nodemailer.createTransport({
            host: process.env.BREVO_SERVER,
            port: process.env.BREVO_PORT,
            secure: false,
            auth: {
                user: process.env.BREVO_MAIL,
                pass: process.env.BREVO_KEY
            }
        });
        transporter.verify((err,done)=>{
            if(err){
                console.log('SMTP problem '+err)
            }
            else{
                console.log('SMTP connected '+done)
            }
        })

        const emailDetails = await transporter.sendMail({
            from: process.env.BREVO_MAIL,
            to: email,
            subject: "Verify Your OTP",
            html: `<p>Your OTP is ${otp}. It will expire in 5 minutes.</p>`
        });

        if (emailDetails) {
            req.session.userOtp = otp;
            req.session.userData = savedUser;
            return res.render("user/verifyotp", { email });
        } else {
            console.log("Email error.");
            return res.json("email-error");
        }
    } catch (error) {
        console.log(error.message);
    }
};
// Verify the Otp
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const { userOtp, userData } = req.session;

        if (otp !== userOtp) {
            return res.render("user/verifyotp", { message: "Invalid OTP" });
        }

        // Find and update the user
        const user = await User.findById(userData._id);
        if (!user) {
            return res.render("user/verifyotp", { message: "User not found" });
        }

        user.isVerified = true;
        await user.save();
        console.log("User verified:", user);

        return res.render("user/login", { message: "Your account has been verified. Please log in." });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred while verifying the OTP.");
    }
};


module.exports = {
    pageNotFound,
    getLoginPage,
    getHomePage,
    getSignupPage,
    newUserRegistration,
    verifyOtp
}