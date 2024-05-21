const express = require('express');
const router = express.Router();
const userController = require('../controllers/userCtrl')

// User Routes

router.get("/pageNotFound", userController.pageNotFound);
router.get('/', userController.getHomePage);
router.get('/login', userController.getLoginPage);
router.get('/signup', userController.getSignupPage);
router.post('/auth/otp', userController.verifyOtp);  // Changed to verifyOtp
router.post('/auth/resend', userController.resendOtp);
router.post('/auth/register', userController.newUserRegistration);  // Changed to newUserRegistration
router.post('/auth/verify-otp', userController.verifyOtp);
router.post('/auth/login', userController.loginUser);
router.get('/auth/logout', userController.logoutUser);
module.exports = router;