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

        const filter = { status: true };

        if (searchQuery) {
            filter.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        if (category) {
            filter.category = category;
        }

        let sortOption = {};
        if (sort === 'priceLow') {
            sortOption = { price: 1 };
        } else if (sort === 'priceHigh') {
            sortOption = { price: -1 };
        }

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

        const productsWithOffers = products.map(product => {
            const categoryOffer = product.category.offerIsActive ? product.category.offerRate : 0;
            const productOffer = product.discount || 0;
            const effectiveOffer = Math.max(categoryOffer, productOffer);
            const effectivePrice = product.price - (product.price * (effectiveOffer / 100));
            return {
                ...product.toObject(),
                effectiveOffer,
                effectivePrice
            };
        });

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

        // Fetch the main product and ensure it is listed
        const product = await Product.findOne({ _id: productId, status: true }).populate('category');

        if (!product) {
            return res.status(404).render('user/productNotFound', {
                title: "Product Not Found",
                admin: req.session.admin
            });
        }

        const categoryOffer = product.category.offerIsActive ? product.category.offerRate : 0;
        const productOffer = product.discount || 0;
        const effectiveOffer = Math.max(categoryOffer, productOffer);
        const effectivePrice = product.price - (product.price * (effectiveOffer / 100));

        let availableSizes = product.variants.filter(variant => variant.stock > 0);
        if (availableSizes.length === 0) {
            product.displayStatus = 'Out of stock';
        } else {
            product.displayStatus = 'Available';
        }

        // Fetch related products and ensure they are listed
        let relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id },
            status: true // Ensure related products are listed
        }).limit(4);

        if (relatedProducts.length === 0) {
            relatedProducts = await Product.find({
                _id: { $ne: product._id },
                status: true // Ensure fallback related products are listed
            }).limit(4);
        }

        const relatedProductsWithOffers = relatedProducts.map(relatedProduct => {
            const categoryOffer = relatedProduct.category.offerIsActive ? relatedProduct.category.offerRate : 0;
            const productOffer = relatedProduct.discount || 0;
            const effectiveOffer = Math.max(categoryOffer, productOffer);
            const effectivePrice = relatedProduct.price - (relatedProduct.price * (effectiveOffer / 100));
            return {
                ...relatedProduct.toObject(),
                effectiveOffer,
                effectivePrice
            };
        });

        res.render('user/productDetails', {
            product: {
                ...product.toObject(),
                effectiveOffer,
                effectivePrice
            },
            relatedProducts: relatedProductsWithOffers,
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