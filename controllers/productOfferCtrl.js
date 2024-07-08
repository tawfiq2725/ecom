const ProductOffer = require('../models/productOffer');
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');

// Display all product offers
const getAllProductOffers = async (req, res) => {
    try {
        const productOffers = await ProductOffer.find().populate('product category');
        res.render('admin/productOfferManagement', {
            layout: 'adminlayout',
            title: "Product Offer Management",
            productOffers: productOffers
        });
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

// Show form to create a new product offer
const getCreateProductOfferPage = async (req, res) => {
    try {
        const products = await Product.find();
        const categories = await Category.find();
        res.render('admin/createProductOffer', {
            layout: 'adminlayout',
            title: "Create Product Offer",
            products: products,
            categories: categories,
            messages: req.flash()
        });
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

// Create a new product offer
const createProductOffer = async (req, res) => {
    try {
        const { product, offer, category, startDate, endDate } = req.body;

        // Check if the category already has an offer
        const existingCategoryOffer = await ProductOffer.findOne({ category });
        if (existingCategoryOffer) {
            req.flash('error', 'This category already has an active offer.');
            return res.redirect('/admin/productOffers/create');
        }

        const newProductOffer = new ProductOffer({
            product,
            offer,
            category,
            startDate,
            endDate,
            status: 'active'
        });

        await newProductOffer.save();
        res.redirect('/admin/productOffers');
    } catch (err) {
        console.log(err.message);
        req.flash('error', 'Internal Server Error');
        res.redirect('/admin/productOffers/create');
    }
};

// Show form to edit an existing product offer
const getEditProductOfferPage = async (req, res) => {
    try {
        const productOfferId = req.params.id;
        const productOffer = await ProductOffer.findById(productOfferId).populate('product category');
        const products = await Product.find();
        const categories = await Category.find();
        res.render('admin/editProductOffer', {
            layout: 'adminlayout',
            title: "Edit Product Offer",
            productOffer: productOffer,
            products: products,
            categories: categories,
            messages: req.flash()
        });
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

// Update an existing product offer
const updateProductOffer = async (req, res) => {
    try {
        const productOfferId = req.params.id;
        const { product, offer, category, startDate, endDate, status } = req.body;

        // Check if the category already has an offer (excluding the current offer being updated)
        const existingCategoryOffer = await ProductOffer.findOne({ category, _id: { $ne: productOfferId } });
        if (existingCategoryOffer) {
            req.flash('error', 'This category already has an active offer.');
            return res.redirect(`/admin/productOffers/edit/${productOfferId}`);
        }

        await ProductOffer.findByIdAndUpdate(productOfferId, {
            product,
            offer,
            category,
            startDate,
            endDate,
            status
        });

        res.redirect('/admin/productOffers');
    } catch (err) {
        console.log(err.message);
        req.flash('error', 'Internal Server Error');
        res.redirect(`/admin/productOffers/edit/${productOfferId}`);
    }
};

// Delete a product offer
const deleteProductOffer = async (req, res) => {
    try {
        const productOfferId = req.params.id;
        await ProductOffer.findByIdAndDelete(productOfferId);
        res.redirect('/admin/productOffers');
    } catch (err) {
        console.log(err.message);
        req.flash('error', 'Internal Server Error');
        res.redirect('/admin/productOffers');
    }
};

module.exports = {
    getAllProductOffers,
    getCreateProductOfferPage,
    createProductOffer,
    getEditProductOfferPage,
    updateProductOffer,
    deleteProductOffer
};
