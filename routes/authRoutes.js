const express = require('express');
const router = express.Router();
const userController = require('../controllers/userCtrl')


// User Routes

router.get("/pageNotFound", userController.pageNotFound);
router.get('/',userController.getHomePage);
router.get('/login',userController.getLoginPage);
router.get('/signup',userController.getSignupPage);
router.post('/auth/otp',userController.newUserRegistration);
router.post('/auth/verify-otp', userController.verifyOtp);

module.exports = router;