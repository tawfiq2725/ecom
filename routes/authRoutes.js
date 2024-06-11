const express = require('express');
const router = express.Router();
const userController = require('../controllers/userCtrl');
const addressController = require('../controllers/addressCtrl')
const usersideCtrl = require('../controllers/usersideCtrl')
const passport = require('../config/passport-config');
const isBlocked = require('../middlewares/auth');


router.use(isBlocked);

// User Routes
router.get("/pageNotFound", userController.pageNotFound);
router.get('/',userController.getHomePage);
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
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        req.session.user = req.user; // Ensure user is set in session
        res.redirect('/');
    }
);

// Forgotpass
router.get('/forgot-pass', userController.getForgotPasswordPage);
router.post('/auth/forgot-pass', userController.handleForgotPassword);
router.get('/reset', userController.handleResetPasswordPageAndRequest);
router.post('/auth/reset', userController.handleResetPasswordPageAndRequest);

// Profile routes
router.get('/profile',userController.gotoProfile);
router.post('/profile/update',userController.updateProfile)
router.get('/address', addressController.getAddresses);
router.post('/address',  addressController.addAddress);
router.delete('/address/:id', addressController.deleteAddress);

// Cart routes
router.get('/cart/data', userController.getCart);
router.post('/add-to-cart', userController.addToCart);
router.post('/cart/remove/:id', userController.removeFromCart);

// Product Page
router.get('/products', usersideCtrl.getProducts);
router.get('/products/:id', usersideCtrl.getProductDetails);



module.exports = router;
