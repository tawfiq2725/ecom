const User = require('../models/userSchema');
const Otp = require('../models/otpSchema');
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Cart = require('../models/cartSchema');
const { GenerateOtp, sendMail } = require('../helpers/otpverification');
require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');




// Controller to fetch and display products on the user side
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;
        const category = req.query.category;
        const sort = req.query.sort; // Get the sort query parameter
        const productType = req.query.productType; // Get the product type query parameter

        const filter = { status: true };
        if (category) {
            filter.category = category;
        }

        // Determine the sort order
        let sortOption = {};
        if (sort === 'priceLow') {
            sortOption = { price: 1 }; // Sort by price in ascending order
        } else if (sort === 'priceHigh') {
            sortOption = { price: -1 }; // Sort by price in descending order
        }

        // Determine the product type filter
        if (productType === 'new') {
            const today = new Date();
            const tenDaysAgo = new Date(today);
            tenDaysAgo.setDate(today.getDate() - 10);
            filter.createdAt = { $gte: tenDaysAgo }; // Products added in the last 10 days
        } else if (productType === 'old') {
            const today = new Date();
            const tenDaysAgo = new Date(today);
            tenDaysAgo.setDate(today.getDate() - 10);
            filter.createdAt = { $lt: tenDaysAgo }; // Products added before the last 10 days
        }

        const [categories, totalProducts, products] = await Promise.all([
            Category.find(),
            Product.countDocuments(filter),
            Product.find(filter)
                .populate('category')
                .sort(sortOption) // Apply the sort option
                .skip(skip)
                .limit(limit)
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('user/products', { 
            title: "Products", 
            products, 
            categories, // Pass categories to the view
            currentPage: page, 
            totalPages, 
            admin: req.session.admin,
            category, // Pass current category filter to the view
            sort, // Pass current sort option to the view
            productType // Pass current product type filter to the view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};



const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('category');

        // Determine product status for each variant
        let availableSizes = product.variants.filter(variant => variant.stock > 0);
        if (availableSizes.length === 0) {
            product.displayStatus = 'Out of stock';
        } else {
            product.displayStatus = 'Available';
        }

        // Fetch related products from the same category excluding the current product
        let relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id }
        }).limit(4);

        // If no related products found, fetch other products excluding the current product
        if (relatedProducts.length === 0) {
            relatedProducts = await Product.find({ _id: { $ne: product._id } }).limit(4);
        }

        res.render('user/productDetails', { product, relatedProducts, admin: req.session.admin, title: "Product Details" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    getProducts,
    getProductDetails
}