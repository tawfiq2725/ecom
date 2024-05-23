const express = require('express');
const routes = express.Router();
const upload = require('../helpers/multer');
const categoryController = require('../controllers/categoryCtrl');
const adminController = require('../controllers/adminCtrl')

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


// Category Routes
routes.get('/categories', categoryController.getCategories);
routes.get('/categories/add', categoryController.getAddCategoryPage);
routes.post('/categories/add', upload.single('image'), categoryController.addCategory);
routes.get('/categories/edit/:id', categoryController.getEditCategoryPage);
routes.post('/categories/edit/:id', upload.single('image'), categoryController.updateCategory);
routes.get('/categories/delete/:id', categoryController.deleteCategory);

module.exports = routes;