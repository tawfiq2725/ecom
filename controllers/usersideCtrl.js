const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Offer = require('../models/offerSchema');
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

        // Fetch categories, total products count, and products
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

        // Fetch active category offers
        const activeOffers = await Offer.find({
            startDate: { $lte: today },
            endDate: { $gte: today },
            status: 'active'
        }).populate('category');

        // Apply the best category offer to the products
        const productsWithOffers = products.map(product => {
            let categoryOffer = activeOffers
                .filter(offer => offer.category._id.toString() === product.category._id.toString())
                .reduce((best, current) => (current.discount > (best?.discount || 0) ? current : best), null);

            if (categoryOffer) {
                product.discountedPrice = product.price - (product.price * categoryOffer.discount / 100);
                product.offerLabel = `${categoryOffer.discount}% off on this category`;
            }

            return product;
        });

        // Render the products page with all applied filters
        res.render('user/products', {
            title: "Products",
            products: productsWithOffers,
            categories,
            currentPage: page,
            totalPages,
            admin: req.session.admin,
            category,
            sort,
            productType,
            searchQuery
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

        // Fetch active offers for this product or its category
        const today = new Date();
        const activeOffers = await Offer.find({
            startDate: { $lte: today },
            endDate: { $gte: today },
            $or: [
                { type: 'product', product: productId },
                { type: 'category', category: product.category._id }
            ]
        });

        // Apply the best offer to the product
        if (activeOffers.length > 0) {
            const productOffer = activeOffers
                .filter(offer => offer.type === 'product')
                .reduce((best, current) => (current.discount > (best?.discount || 0) ? current : best), null);

            const categoryOffer = activeOffers
                .filter(offer => offer.type === 'category')
                .reduce((best, current) => (current.discount > (best?.discount || 0) ? current : best), null);

            if (productOffer && (!categoryOffer || productOffer.discount > categoryOffer.discount)) {
                product.discountedPrice = product.price - (product.price * productOffer.discount / 100);
                product.offerLabel = `${productOffer.discount}% off on this product`;
            } else if (categoryOffer) {
                product.discountedPrice = product.price - (product.price * categoryOffer.discount / 100);
                product.offerLabel = `${categoryOffer.discount}% off on this category`;
            }
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