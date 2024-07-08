const express = require('express');
const routes = express.Router();
const { productUpload, categoryUpload } = require('../helpers/multer');
const adminController = require('../controllers/adminCtrl');
const categoryController = require('../controllers/categoryCtrl');
const productController = require('../controllers/productCtrl');
const couponController = require('../controllers/couponCtrl.js')
const offerController = require('../controllers/offerCtrl.js');
const productOfferController = require('../controllers/productOfferCtrl.js');
const salesCtrl = require('../controllers/salesCtrl.js')

// Admin routes
routes.get(['/', '/login'], adminController.getLoginPage);
routes.get('/signup', adminController.getSignupPage);
routes.get('/dashboard', adminController.getHomePage);
routes.post('/auth/register', adminController.newUserRegistration);
routes.post('/auth/login', adminController.loginUser);
routes.get('/auth/logout', adminController.logoutUser);

// Management
routes.get('/userm', adminController.getAllUsers);
routes.post('/block/:id', adminController.blockUser);
routes.post('/unblock/:id', adminController.unblockUser);

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
routes.get('/products/manage-stock/:id', productController.getManageStockPage);
routes.post('/products/update-stock/:id', productController.updateStock);

// Orders Management
routes.get('/orders', productController.getOrderList);
routes.put('/order/status/:id', productController.updateOrderStatus);

// Return Management
routes.get('/returns',productController.getReturnList);
routes.put('/return/status/:id', productController.updateReturnStatus);

routes.get('/salesreport', salesCtrl.getSalesReportPage);
routes.get('/salesreport/generate', salesCtrl.generateSalesReport);
routes.post('/salesreport/download', salesCtrl.downloadSalesReport);

// List coupons
routes.get('/coupons', couponController.listCoupons);
routes.get('/coupon/add', couponController.showAddCouponForm);
routes.post('/coupon/add', couponController.addCoupon);
routes.get('/coupon/edit/:id', couponController.showEditCouponForm);
routes.post('/coupon/edit/:id', couponController.editCoupon);
routes.get('/coupon/list/:id', couponController.listCoupon);
routes.get('/coupon/unlist/:id', couponController.unlistCoupon);

// Category Offer
routes.get('/offers', offerController.getAllOffers);
routes.get('/offers/create', offerController.getCreateOfferPage);
routes.post('/offers/create', offerController.createOffer);
routes.get('/offers/edit/:id', offerController.getEditOfferPage);
routes.post('/offers/edit/:id', offerController.updateOffer);
routes.post('/offers/delete/:id', offerController.deleteOffer);


routes.get('/productOffers', productOfferController.getAllProductOffers);
routes.get('/productOffers/create', productOfferController.getCreateProductOfferPage);
routes.post('/productOffers/create', productOfferController.createProductOffer);
routes.get('/productOffers/edit/:id', productOfferController.getEditProductOfferPage);
routes.post('/productOffers/edit/:id', productOfferController.updateProductOffer);
routes.post('/productOffers/delete/:id', productOfferController.deleteProductOffer);

module.exports = routes;