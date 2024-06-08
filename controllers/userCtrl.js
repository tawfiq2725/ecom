const User = require('../models/userSchema');
const Otp = require('../models/otpSchema')
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema')
const Cart = require('../models/cartSchema')
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
    let firstname, lastname, mobile, email, password, password2;
    try {
        // Assign values inside the try block
        ({ firstname, lastname, mobile, email, password, password2 } = req.body);

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
            firstname,
            lastname,
            mobile,
            email,
            password: hashedPassword,
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

// Controller to fetch and display products on the user side
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;
        const category = req.query.category;
        const sort = req.query.sort; // Get the sort query parameter
        const productType = req.query.productType; // Get the product type query parameter

        const filter = { status: true };
        if (category) {
            filter.category = category;
        }

        // Determine the sort order
        let sortOption = {};
        if (sort === 'priceLow') {
            sortOption = { price: 1 }; // Sort by price in ascending order
        } else if (sort === 'priceHigh') {
            sortOption = { price: -1 }; // Sort by price in descending order
        }

        // Determine the product type filter
        if (productType === 'new') {
            const today = new Date();
            const tenDaysAgo = new Date(today);
            tenDaysAgo.setDate(today.getDate() - 10);
            filter.createdAt = { $gte: tenDaysAgo }; // Products added in the last 10 days
        } else if (productType === 'old') {
            const today = new Date();
            const tenDaysAgo = new Date(today);
            tenDaysAgo.setDate(today.getDate() - 10);
            filter.createdAt = { $lt: tenDaysAgo }; // Products added before the last 10 days
        }

        const [categories, totalProducts, products] = await Promise.all([
            Category.find(),
            Product.countDocuments(filter),
            Product.find(filter)
                .populate('category')
                .sort(sortOption) // Apply the sort option
                .skip(skip)
                .limit(limit)
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('user/products', { 
            title: "Products", 
            products, 
            categories, // Pass categories to the view
            currentPage: page, 
            totalPages, 
            admin: req.session.admin,
            category, // Pass current category filter to the view
            sort, // Pass current sort option to the view
            productType // Pass current product type filter to the view
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

        // Determine product status for each variant
        let availableSizes = product.variants.filter(variant => variant.stock > 0);
        if (availableSizes.length === 0) {
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

        res.render('user/productDetails', { product, relatedProducts, admin: req.session.admin, title: "Product Details" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};



// User profile
const gotoProfile = async(req, res) => {
    if (req.session.user) {
        const user = await User.findById(req.session.user._id);
        res.render('user/profile-details', {
            title: "User Profile",
            user: {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                mobile: user.mobile
            }
        });
    } else {
        res.redirect('/login');
    }
};

// User Profile Update

const updateProfile = async (req, res) => {
    try {
        const { firstname, lastname, email, mobile } = req.body;
        const userId = req.session.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.firstname = firstname;
        user.lastname = lastname;
        user.email = email;
        user.mobile = mobile;

        await user.save();

        req.session.user = user; 
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Go to address page

const gotoAddress = async(req,res)=>{
    if(req.session.user){
        res.render('user/address',{title:"Address Details"})
    }
    else{
        res.redirect('/login');
    }
}
const getCart = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.product');
        if (!cart) {
            return res.render('user/cart', { cart: null, title: "Cart Page" });
        }
        res.render('user/cart', { cart, title: "Cart Page" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, variantSize, quantity } = req.body;
        const userId = req.session.user._id;

        if (!productId || !variantSize || !quantity) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Validate quantity
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ success: false, message: "Invalid quantity" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const variant = product.variants.find(v => v.size === variantSize);
        if (!variant) {
            return res.status(400).json({ success: false, message: "Variant not found" });
        }

        if (variant.stock < parsedQuantity) {
            return res.status(400).json({ success: false, message: `Only ${variant.stock} units available in the selected size.` });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [], totalPrice: 0 });
        }

        const existingCartItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.size === variantSize
        );

        if (existingCartItemIndex !== -1) {
            cart.items[existingCartItemIndex].quantity += parsedQuantity;
        } else {
            cart.items.push({ product: productId, size: variantSize, quantity: parsedQuantity });
        }

        cart.totalPrice += product.price * parsedQuantity;
        await cart.save();

        res.json({ success: true, message: "Product added to cart" });

    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};




const removeFromCart = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Please log in to remove products from your cart.' });
    }

    try {
        const userId = req.session.user._id;
        const productId = req.params.id;

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            const product = await Product.findById(productId);
            cart.totalPrice -= cart.items[itemIndex].quantity * product.price;

            cart.items.splice(itemIndex, 1);

            if (cart.totalPrice < 0) {
                cart.totalPrice = 0;
            }

            await cart.save();

            return res.status(200).json({ success: true, message: 'Product removed from cart' });
        } else {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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
    getProducts,
    getProductDetails,
    gotoProfile,
    gotoAddress,
    updateProfile,
    addToCart,
    getCart,
    removeFromCart
}