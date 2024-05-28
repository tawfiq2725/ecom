const express = require('express');
const routes = express.Router();
const { productUpload, categoryUpload } = require('../helpers/multer');
const adminController = require('../controllers/adminCtrl');
const categoryController = require('../controllers/categoryCtrl');
const productController = require('../controllers/productCtrl');

// Admin routes
routes.get(['/', '/login'], adminController.getLoginPage);
routes.get('/signup', adminController.getSignupPage);
routes.get('/dashboard', adminController.getHomePage);
routes.post('/auth/register', adminController.newUserRegistration);
routes.post('/auth/login', adminController.loginUser);
routes.get('/auth/logout', adminController.logoutUser);

// Management
routes.get('/userm', adminController.getAllUsers);
routes.get('/block/:id', adminController.blockUser);
routes.get('/unblock/:id', adminController.unblockUser);

// Category Routes
routes.get('/categories', categoryController.getCategories);
routes.get('/categories/add', categoryController.getAddCategoryPage);
routes.post('/categories/add', categoryUpload.single('image'), categoryController.addCategory);
routes.get('/categories/edit/:id', categoryController.getEditCategoryPage);
routes.post('/categories/edit/:id', categoryUpload.single('image'), categoryController.updateCategory);
routes.post('/categories/toggle/:id', categoryController.toggleCategoryStatus); 

// Product Management Routes
routes.get('/products', productController.getProducts);
routes.get('/products/add', productController.getAddProductPage);
routes.post('/products/add', productUpload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'subImages', maxCount: 3 }
]), productController.addProduct);
routes.get('/products/edit/:id', productController.getEditProductPage);
routes.post('/products/edit/:id', productUpload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'subImages', maxCount: 3 }
]), productController.updateProduct);
routes.delete('/products/delete/:id', productController.deleteProduct); // Change to DELETE method
routes.post('/products/toggle-status/:id', productController.toggleProductStatus)

module.exports = routes;
