const express = require('express');
const router = express.Router();
const userController = require('../controllers/userCtrl');
const passport = require('../config/passport-config');
const { isBlocked } = require('../middleware/user');

// User Routes
router.get("/pageNotFound", userController.pageNotFound);
router.get('/',isBlocked,userController.getHomePage);
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
    async (req, res) => {
        if (!req.user.mobile || !req.user.password) {
            req.session.user = req.user; // Save user in session
            return res.redirect('/auth/google/additional-info');
        }
        req.session.user = req.user; // Ensure user is set in session
        res.redirect('/');
    }
);

router.get('/auth/google/additional-info', userController.getAdditionalInfoPage);
router.post('/auth/google/additional-info', userController.saveAdditionalInfo);

// Product Page
router.get('/products', userController.getProducts);
router.get('/products/:id', userController.getProductDetails);
module.exports = router;
