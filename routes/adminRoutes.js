const adminController = require('../controllers/adminCtrl')
const express = require('express');
const routes = express.Router();

routes.get(['/','/login'],adminController.getLoginPage);
routes.get('/signup',adminController.getSignupPage);
routes.get('/dashboard',adminController.getHomePage);
routes.post('/auth/register',adminController.newUserRegistration);
routes.post('/auth/login',adminController.loginUser);
routes.get('/auth/logout',adminController.logoutUser);

// Management

routes.get('/userm',adminController.getAllUsers);
routes.get('/block/:id', adminController.blockUser);
routes.get('/unblock/:id', adminController.unblockUser);

module.exports = routes;