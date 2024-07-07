const express = require('express');
const router = express.Router();
const userController = require('../controllers/userCtrl');
const addressController = require('../controllers/addressCtrl');
const usersideCtrl = require('../controllers/usersideCtrl');
const orderCtrl = require('../controllers/orderCtrl');
const paymentCtrl = require('../controllers/paymentCtrl');
const whislistCtrl = require('../controllers/whislistCtrl');
const returnController = require('../controllers/returnCtrl');
const referralController = require('../controllers/referalCtrl')
const passport = require('../config/passport-config');
const multer = require('multer');
const upload = multer();
const isBlocked = require('../middlewares/auth');

router.use(isBlocked);

// User Routes
router.get('/pageNotFound', userController.pageNotFound);
router.get('/', userController.getHomePage);
router.get('/login', userController.getLoginPage);
router.get('/signup', userController.getSignupPage);
router.post('/auth/otp', userController.verifyOtp);
router.post('/auth/resend', userController.resendOtp);
router.post('/auth/register', userController.newUserRegistration);
router.post('/auth/verify-otp', userController.verifyOtp);
router.post('/auth/login', userController.loginUser);
router.get('/auth/logout', userController.logoutUser);

// Google OAuth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    req.session.user = req.user; // Ensure user is set in session
    res.redirect('/');
});

// Forgot Password
router.get('/forgot-pass', userController.getForgotPasswordPage);
router.post('/auth/forgot-pass', userController.handleForgotPassword);
router.get('/reset', userController.handleResetPasswordPageAndRequest);
router.post('/auth/reset', userController.handleResetPasswordPageAndRequest);

// Referrals
router.get('/referrals', referralController.getUserReferrals);

// Profile Routes
router.get('/profile', userController.gotoProfile);
router.post('/profile/update', userController.updateProfile);
router.get('/address', addressController.getAddresses);
router.post('/address', addressController.addAddress);
router.delete('/address/:id', addressController.deleteAddress);
router.get('/address/edit/:id', addressController.getEditAddress); // Fetch address to edit
router.post('/address/edit/:id', addressController.updateAddress);

router.get('/wishlist', whislistCtrl.getWishlistPage);
router.post('/wishlist/add', whislistCtrl.addToWishlist);
router.post('/wishlist/remove', whislistCtrl.removeFromWishlist);

// Cart Routes
router.get('/cart/data', userController.getCart);
router.post('/add-to-cart', userController.addToCart);
router.post('/cart/remove/:id', userController.removeFromCart);
router.post('/cart/update/:productId', userController.updateCartQuantity);
router.get('/api/product/:productId/variant/:size', userController.getProductVariant);

// Product Page
router.get('/products', usersideCtrl.getProducts);
router.get('/products/:id', usersideCtrl.getProductDetails);

// Order Management
router.get('/checkout', orderCtrl.checkout);
router.post('/orders', orderCtrl.createOrder);
router.post('/api/apply-coupon', orderCtrl.applyCoupon);
router.post('/api/remove-coupon', orderCtrl.removeCoupon);
router.get('/confirm', orderCtrl.orderConfirm);
router.get('/orders', orderCtrl.getUserOrders);
router.get('/orders/:id', orderCtrl.getOrderDetails);
router.get('/orders/:id/invoice',orderCtrl.downloadInvoice)
router.post('/orders/:id/cancel', orderCtrl.cancelOrder);

// New Routes for Razorpay Integration
router.post('/api/create-order', orderCtrl.createRazorpayOrder);
router.post('/confirm-razorpay-payment', orderCtrl.confirmRazorpayPayment);
router.post('/api/verify-payment', orderCtrl.verifyRazorpayPayment);

// Return Management (Use only returnController)
router.get('/orders/:orderId/return', returnController.showReturnForm); // Move to returnController
router.get('/returns', returnController.getUserReturnRequests);
router.post('/returns', upload.none(), returnController.createReturnRequest);

// Payment Routes
router.get('/wallet', paymentCtrl.getWallet);
router.get('/wallet/add-money', paymentCtrl.addMoneyForm);
router.post('/add-money', paymentCtrl.initiatePayment);
router.post('/verify-payment', paymentCtrl.verifyPayment);

module.exports = router;
