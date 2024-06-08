const express = require('express');
const router = express.Router();
const userController = require('../controllers/userCtrl');
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

// Product Page
router.get('/products', userController.getProducts);
router.get('/products/:id', userController.getProductDetails);


// Profile routes
router.get('/profile',userController.gotoProfile);
router.get('/address',userController.gotoAddress);
router.post('/profile/update',userController.updateProfile)

// Cart routes
router.get('/cart/data', userController.getCart);
router.post('/add-to-cart', userController.addToCart);
router.post('/cart/remove/:id', userController.removeFromCart);


module.exports = router;
