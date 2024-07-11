const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
require('dotenv').config();

const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;
        const category = req.query.category;
        const sort = req.query.sort;
        const productType = req.query.productType;
        const searchQuery = req.query.search;

        // Initialize filter with active status
        const filter = { status: true };

        // Apply search filter if present
        if (searchQuery) {
            filter.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        // Apply category filter if present
        if (category) {
            filter.category = category;
        }

        // Initialize sorting option
        let sortOption = {};
        if (sort === 'priceLow') {
            sortOption = { price: 1 };
        } else if (sort === 'priceHigh') {
            sortOption = { price: -1 };
        }

        // Apply product type filter if present
        const today = new Date();
        if (productType === 'new') {
            const tenDaysAgo = new Date(today);
            tenDaysAgo.setDate(today.getDate() - 10);
            filter.createdAt = { $gte: tenDaysAgo };
        } else if (productType === 'old') {
            const tenDaysAgo = new Date(today);
            tenDaysAgo.setDate(today.getDate() - 10);
            filter.createdAt = { $lt: tenDaysAgo };
        }

        // Fetch categories, total products count, products, and category offers
        const [categories, totalProducts, products] = await Promise.all([
            Category.find(),
            Product.countDocuments(filter),
            Product.find(filter)
                .populate('category')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
        ]);

        const totalPages = Math.ceil(totalProducts / limit);


        // Render the products page with all applied filters and category offers
        res.render('user/products', {
            title: "Products",
            products,
            categories,
            currentPage: page,
            totalPages,
            admin: req.session.admin,
            category,
            sort,
            productType,
            searchQuery,
             
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

        let availableSizes = product.variants.filter(variant => variant.stock > 0);
        if (availableSizes.length === 0) {
            product.displayStatus = 'Out of stock';
        } else {
            product.displayStatus = 'Available';
        }

        let relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id }
        }).limit(4);

        if (relatedProducts.length === 0) {
            relatedProducts = await Product.find({ _id: { $ne: product._id } }).limit(4);
        }

        

        res.render('user/productDetails', {
            product,
            relatedProducts,
            admin: req.session.admin,
            title: "Product Details"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};


module.exports = {
    getProducts,
    getProductDetails
}