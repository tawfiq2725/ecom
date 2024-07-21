const User = require('../models/userSchema');
const Otp = require('../models/otpSchema');
const Product = require('../models/productSchema');
const Cart = require('../models/cartSchema');
const Address = require('../models/addressSchema')
const Wallet = require('../models/walletSchema')
const { GenerateOtp, sendMail } = require('../helpers/otpverification');
const { handleReferral } = require('../controllers/referalCtrl');
require('dotenv').config();
const bcrypt = require('bcrypt');

// Page Not Found
const pageNotFound = async (req, res) => {
    try {
        res.render("404");
    } catch (error) {
        console.log(error.message);
    }
};

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
        const locals = {
            title: "Login Page"
        };
        if (!req.session.user) {
            res.render("user/login", { title: locals.title });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
    }
};

// Go to Signup Page
const getSignupPage = async (req, res) => {
    try {
        const locals = {
            title: "Sign Up Page"
        };
        res.render("user/signup", { title: locals.title });
    } catch (error) {
        console.log(error.message);
    }
};
// Register New Member
const newUserRegistration = async (req, res) => {
    let { firstname, lastname, mobile, email, password, password2, referralCode } = req.body;
    try {
      const findUserByEmail = await User.findOne({ email });
      if (findUserByEmail) {
        return res.render("user/signup", { error_msg: "User with this email already exists.", firstname, lastname, email, mobile });
      }
  
      const findUserByMobile = await User.findOne({ mobile });
      if (findUserByMobile) {
        return res.render("user/signup", { error_msg: "User with this mobile number already exists.", firstname, lastname, email, mobile });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const referrer = referralCode ? await User.findOne({ referralCode }) : null;
      const referredBy = referrer ? referrer._id : null;
  
      const generateReferralCode = () => {
        return Math.random().toString(36).substring(2, 8); // Generates a random 8-character code
      };
  
      const newUser = new User({
        firstname,
        lastname,
        mobile,
        email,
        password: hashedPassword,
        isBlocked: false,
        isVerified: false,
        isAdmin: false,
        referredBy,
        referralCode: generateReferralCode()
      });
  
      const savedUser = await newUser.save();
  
      if (!savedUser) {
        return res.render("user/signup", { error_msg: "Failed to register user. Please try again.", firstname, lastname, email, mobile });
      }
  
      if (referrer) {
        await handleReferral(referralCode, savedUser);
      }
  
      const userWallet = new Wallet({ userId: savedUser._id });
      const savedWallet = await userWallet.save();
  
      if (!savedWallet) {
        return res.render("user/signup", { error_msg: "Failed to create user wallet. Please try again.", firstname, lastname, email, mobile });
      }
  
      savedUser.wallet = userWallet._id;
      const finalSavedUser = await savedUser.save();
  
      if (!finalSavedUser) {
        return res.render("user/signup", { error_msg: "Failed to link wallet to user. Please try again.", firstname, lastname, email, mobile });
      }
  
      const otpcode = GenerateOtp();
      const otpData = new Otp({
        userId: savedUser._id,
        otp: otpcode,
        createdAt: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      });
  
      await otpData.save();
  
      const sendmail = await sendMail(email, otpcode);
      if (sendmail) {
        req.session.userOtp = otpcode;
        req.session.userData = savedUser;
        return res.render("user/verifyotp", { email });
      } else {
        return res.render("user/signup", { error_msg: "Failed to send OTP email.", firstname, lastname, email, mobile });
      }
  
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).render("user/signup", { error_msg: "An error occurred during registration.", firstname, lastname, email, mobile });
    }
  };
  




// Resend Otp Page
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, error_msg: "User not found" });
        }

        const otpcode = GenerateOtp();

        const otpData = await Otp.findOneAndUpdate(
            { userId: user._id },
            {
                otp: otpcode,
                createdAt: Date.now(),
                expiresAt: Date.now() + (5 * 60 * 1000)
            },
            { new: true, upsert: true }
        );

        console.log("OTP saved:", otpData);

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
            title: "Otp Page"
        };
        res.render("verify-otp", { title: locals.title });
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
            return res.status(400).json({ error_msg: "Invalid OTP" });
        }

        const user = await User.findById(userData._id);
        if (!user) {
            return res.status(400).json({ error_msg: "User not found" });
        }

        user.isVerified = true;
        await user.save();
        req.session.userOtp = null;
        req.session.userData = null;
        return res.status(200).json({ success_msg: "Your account has been verified. Please log in." });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error_msg: "An error occurred while verifying the OTP." });
    }
};
// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render("user/login", { error_msg: "Please fill in both email and password." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render("user/login", { error_msg: "Invalid email or password." });
        }

        if (!user.isVerified) {
            return res.render("user/login", { error_msg: "Please verify your email first." });
        }

        if (user.isBlocked) {
            return res.render("user/login", { error_msg: "Your account is blocked. Please contact support." });
        }

        const isMatch = await bcrypt.compare(password, user.password); // Add await here
        if (!isMatch) {
            return res.render("user/login", { error_msg: "Invalid email or password." });
        }

        req.session.user = user;
        return res.redirect("/");
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send("An error occurred during login.");
    }
};

// Logout user
const logoutUser = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err.message);
                res.redirect('/');
                return res.status(500).send("An error occurred during logout.");
            }
            res.redirect('/login');
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred during logout.");
    }
};

// Forgot Password Page
const getForgotPasswordPage = async (req, res) => {
    try {
        const locals = {
            title: "Forgot Password"
        };
        res.render("user/forgot-password", { title: locals.title });
    } catch (error) {
        console.log(error.message);
    }
};

// Handle Forgot Password Request
const handleForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render("user/forgot-password", { error_msg: "No account with that email address exists." });
        }

        const otp = GenerateOtp();
        const otpExpires = Date.now() + (5 * 60 * 1000);

        const newOtp = new Otp({
            userId: user._id,
            otp: otp,
            expiresAt: otpExpires
        });

        await newOtp.save();

        const emailDetails = await sendMail(email, otp);
        if (!emailDetails) {
            return res.render("user/forgot-password", { error_msg: "Failed to send OTP email." });
        }

        res.render("user/reset-password", { success_msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.', title: "Reset Password" });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred while processing your request.");
    }
};

// Reset Password Page & Handle Reset Password
const handleResetPasswordPageAndRequest = async (req, res) => {
    try {
        const { otp, password, password2 } = req.body;

        if (!otp || !password || !password2) {
            return res.render("user/reset-password", { error_msg: "Please fill in all fields." });
        }

        if (password !== password2) {
            return res.render("user/reset-password", { error_msg: "Passwords do not match." });
        }

        const otpData = await Otp.findOne({ otp });
        if (!otpData) {
            return res.render("user/reset-password", { error_msg: "Invalid OTP." });
        }

        if (otpData.expiresAt < Date.now()) {
            return res.render("user/reset-password", { error_msg: "OTP has expired." });
        }

        const user = await User.findById(otpData.userId);
        if (!user) {
            return res.render("user/reset-password", { error_msg: "User not found." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        await Otp.deleteMany({ userId: user._id });

        res.render("user/login", { success_msg: "Password has been reset. Please log in." });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred while processing your request.");
    }
};








// User profile
const gotoProfile = async (req, res) => {
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

const updateCartQuantity = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Please log in to update your cart.' });
    }

    try {
        const { productId } = req.params;
        const { size, quantity } = req.body;
        const userId = req.session.user._id;

        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ success: false, message: "Invalid quantity" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const variant = product.variants.find(v => v.size === size);
        if (!variant) {
            return res.status(400).json({ success: false, message: "Variant not found" });
        }

        if (variant.stock < parsedQuantity) {
            return res.status(400).json({ success: false, message: `Only ${variant.stock} units available in the selected size.` });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const existingCartItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.size === size
        );

        if (existingCartItemIndex !== -1) {
            const cartItem = cart.items[existingCartItemIndex];
            cart.totalPrice -= cartItem.quantity * product.price; // Remove the old amount
            cartItem.quantity = parsedQuantity;
            cart.totalPrice += cartItem.quantity * product.price; // Add the new amount
        } else {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        await cart.save();

        res.json({ success: true, message: "Cart updated" });

    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getProductVariant = async (req, res) => {
    try {
        const { productId, size } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const variant = product.variants.find(v => v.size === size);
        if (!variant) {
            return res.status(404).json({ success: false, message: "Variant not found" });
        }

        res.json({ success: true, stock: variant.stock });
    } catch (error) {
        console.error('Error fetching product variant:', error);
        res.status(500).json({ success: false, message: "Server error" });
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
    gotoProfile,
    updateProfile,
    addToCart,
    getCart,
    removeFromCart,
    updateCartQuantity,
    getProductVariant,
    getForgotPasswordPage,
    handleForgotPassword,
    handleResetPasswordPageAndRequest,
}