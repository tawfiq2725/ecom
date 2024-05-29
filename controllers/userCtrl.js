const User = require('../models/userSchema');
const Otp = require('../models/otpSchema')
const { GenerateOtp,sendMail} = require('../helpers/otpverification')
require('dotenv').config()
const bcrypt = require('bcrypt')

// Page Not Found

const pageNotFound = async (req, res) => {
    try {
        res.render("404")
    } catch (error) {
        console.log(error.message);
    }
}



// Home Page
const getHomePage = async (req, res) => {
    try {
        const locals = { title: "Hosssom Online Store" };
        res.render('index', { title: locals.title, user: req.session.user, admin: req.session.admin });
    } catch (error) {
        console.log("Something went wrong: " + error);
    }
};


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
            res.redirect('/')
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

            res.render("user/signup",{title:locals.title})
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
            return res.render("user/signup", { error_msg: "The confirm password does not match.", firstname, lastname, email, mobile });
        }

        // Check if the user already exists
        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("user/signup", { error_msg: "User with this email already exists.", firstname, lastname, email, mobile });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds); 
        // Create and save the new user
        const newUser = new User({
            firstname:firstname,
            lastname:lastname,
            mobile:mobile,
            email:email,
            password:hashedPassword,
            isBlocked: false,
            isVerified: false,
            isAdmin: false
        });

        const savedUser = await newUser.save();

        // Generate and save OTP
        const otpcode = GenerateOtp();
        const otpData = new Otp({
            userId: savedUser._id,
            otp: otpcode,
            createdAt: Date.now(),
            expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
        });

        await otpData.save();

        // Send OTP email
        const sendmail = await sendMail(email, otpcode);
        if (sendmail) {
            req.session.userOtp = otpcode;
            req.session.userData = savedUser;
            return res.render("user/verifyotp", { email });
        } else {
            return res.render("user/signup", { error_msg: "Failed to send OTP email.", firstname, lastname, email, mobile });
        }

    } catch (error) {
        res.status(500).render("user/signup", { error_msg: "An error occurred during registration.", firstname, lastname, email, mobile });
    }
};
// Resend Otp Page
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, error_msg: "User not found" });
        }

        // Generate a new OTP
        const otpcode = GenerateOtp();

        // Update the OTP record
        const otpData = await Otp.findOneAndUpdate(
            { userId: user._id },
            {
                otp: otpcode,
                createdAt: Date.now(),
                expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
            },
            { new: true, upsert: true }
        );

        console.log("OTP saved:", otpData);

        // Send OTP email
        const sendmail = await sendMail(email, otpcode);
        if (sendmail) {
            req.session.userOtp = otpcode;
            req.session.userData = user;
            return res.json({ success: true, success_msg: "OTP resent successfully", email });
        } else {
            console.log("Email error.");
            return res.json({ success: false, error_msg: "Failed to send OTP email." });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, error_msg: "An error occurred while resending the OTP." });
    }
};
// Go to otp page
const getOtpPage = async (req, res) => {
    try {
        const locals = {
            title:"Otp Page"
        }
        res.render("verify-otp",{title:locals.title})
    } catch (error) {
        console.log(error.message);
    }
}

// Verify the Otp
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const { userOtp, userData } = req.session;

        if (otp !== userOtp) {
            return res.render("user/verifyotp", { error_msg: "Invalid OTP" });
        }

        // Find and update the user
        const user = await User.findById(userData._id);
        if (!user) {
            return res.render("user/verifyotp", { error_msg: "User not found" });
        }

        user.isVerified = true;
        await user.save();
        return res.render("user/login", { success_msg: "Your account has been verified. Please log in." });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred while verifying the OTP.");
    }
};




// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if both email and password are provided
        if (!email || !password) {
            return res.render("user/login", { error_msg: "Please fill in both email and password." });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.render("user/login", { error_msg: "Invalid email or password." });
        }

        // Check if the user is verified
        if (!user.isVerified) {
            return res.render("user/login", { error_msg: "Please verify your email first." });
        }

        // Check if the user is blocked
        if (user.isBlocked) {
            return res.render("user/login", { error_msg: "Your account is blocked. Please contact support." });
        }

        // Validate password
        const isMatch = bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("user/login", { error_msg: "Invalid email or password." });
        }
        
        // Set user session
        req.session.user = user;
        return res.redirect("/");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred during login.");
    }
};

// Logout user
const logoutUser = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err.message);
                res.redirect('/')
                return res.status(500).send("An error occurred during logout.");
            }
            res.redirect('/login');
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred during logout.");
    }
};
// Go to Additional Info While Google Auth
const getAdditionalInfoPage = async (req, res) => {
    res.render('user/additionalinfo', { title: "Additional Information" });
};

// Additional Info While Google Auth
const saveAdditionalInfo = async (req, res) => {
    try {
        const { mobile, password, password2 } = req.body;

        if (password !== password2) {
            return res.render('user/additionalinfo', { error_msg: "Passwords do not match." });
        }

        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.render('user/additionalinfo', { error_msg: "User not found." });
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        user.mobile = mobile;
        await user.save();

        req.session.user = user; // Update session with updated user info
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred while saving additional information.");
    }
};
const Product = require('../models/productSchema');

// Controller to fetch and display products on the user side
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        const totalProducts = await Product.countDocuments({ status: true });
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await Product.find({ status: true })
            .populate('category')
            .skip(skip)
            .limit(limit);

        res.render('user/products', { 
            title: "Products", 
            products, 
            currentPage: page, 
            totalPages, 
            admin: req.session.admin 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};




const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('category');

        // Determine product status
        if (!product.status) {
            product.displayStatus = 'Unavailable';
        } else if (product.stock === 0) {
            product.displayStatus = 'Out of stock';
        } else {
            product.displayStatus = 'Available';
        }

        // Fetch related products from the same category excluding the current product
        let relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id }
        }).limit(4);

        // If no related products found, fetch other products excluding the current product
        if (relatedProducts.length === 0) {
            relatedProducts = await Product.find({ _id: { $ne: product._id } }).limit(4);
        }

        res.render('user/productDetails', { product, relatedProducts, admin: req.session.admin });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};




module.exports = {
    pageNotFound,
    getLoginPage,
    getHomePage,
    getSignupPage,
    newUserRegistration,
    getOtpPage,
    resendOtp,
    verifyOtp,
    loginUser,
    logoutUser,
    getAdditionalInfoPage,
    saveAdditionalInfo,
    getProducts,
    getProductDetails
}