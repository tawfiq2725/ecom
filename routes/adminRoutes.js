const express = require('express');
const routes = express.Router();
const { productUpload, categoryUpload } = require('../helpers/multer');
const adminController = require('../controllers/adminCtrl');
const categoryController = require('../controllers/categoryCtrl');
const productController = require('../controllers/productCtrl');
const couponController = require('../controllers/couponCtrl.js');
const salesCtrl = require('../controllers/salesCtrl.js');
const offerCtrl = require('../controllers/offerCtrl.js');
const Order = require('../models/orderSchema.js')

// Admin routes
routes.get(['/', '/login'], adminController.getLoginPage);
routes.get('/signup', adminController.getSignupPage);
routes.get('/dashboard', adminController.getHomePage);
routes.post('/auth/register', adminController.newUserRegistration);
routes.post('/auth/login', adminController.loginUser);
routes.get('/auth/logout', adminController.logoutUser);

// Helper function to get date range based on selected option
function getDateRange(dateRange, filterDate) {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
        case 'custom':
            startDate = new Date(filterDate);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            break;
    }

    return { startDate, endDate };
}

routes.get('/order-analysis', async (req, res) => {
    const { filterType,dateRange, filterDate } = req.query;

    console.log(`Received request for filterType=${filterType},dateRange=${dateRange}, filterDate=${filterDate}`);

    try {
        let data;
        if (filterType === 'products') {
            data = await getProductOrderAnalysis(dateRange, filterDate);
        } else {
            data = await getCategoryOrderAnalysis(dateRange, filterDate);
        }

        console.log('Sending data:', data);
        res.json(data);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Updated function for product order analysis
async function getProductOrderAnalysis(dateRange, filterDate) {
    const { startDate, endDate } = getDateRange(dateRange, filterDate);

    const orders = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $unwind: '$items' },
        { $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
        }},
        { $unwind: '$productDetails' },
        { $group: {
            _id: '$productDetails.name',
            totalQuantity: { $sum: '$items.quantity' }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.totalQuantity);

    return { labels, orders: data };
}

// Updated function for category order analysis
async function getCategoryOrderAnalysis(dateRange, filterDate) {
    const { startDate, endDate } = getDateRange(dateRange, filterDate);

    const orders = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $unwind: '$items' },
        { $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
        }},
        { $unwind: '$productDetails' },
        { $lookup: {
            from: 'categories',
            localField: 'productDetails.category',
            foreignField: '_id',
            as: 'categoryDetails'
        }},
        { $unwind: '$categoryDetails' },
        { $group: {
            _id: '$categoryDetails.name',
            totalQuantity: { $sum: '$items.quantity' }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.totalQuantity);

    return { labels, orders: data };
}


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
routes.get('/category/offers', offerCtrl.gotoCategoryOffer);
routes.post('/category/offers/add-edit', offerCtrl.addOrEditOffer);
routes.post('/category/offers/activate', offerCtrl.activateOffer);

// Product Offer
routes.get('/product/offers', offerCtrl.gotoProductOffer);
routes.post('/product/offers/add-edit', offerCtrl.ProductaddOrEditOffer);
routes.post('/product/offers/activate', offerCtrl.ProductactivateOffer);

module.exports = routes;