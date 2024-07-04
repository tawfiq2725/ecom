const Offer = require('../models/offerSchema');
const Category = require('../models/categorySchema');
const Product = require('../models/productSchema');


// Get all offers
const getOffers = async (req, res) => {
    try {
        const offers = await Offer.find().populate('category');
        res.render('admin/offers', { title: "Offer List", offers, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Add offer page
const getAddOfferPage = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/addOffer', { title: "Add Offer", categories, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Add a new offer
const addOffer = async (req, res) => {
    try {
        const { name, discount, category, startDate, endDate } = req.body;

        const newOffer = new Offer({ name, discount, category, startDate, endDate });
        await newOffer.save();

        req.flash('success_msg', 'Offer added successfully');
        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error adding offer');
        res.redirect('/admin/offers');
    }
};

// Edit offer page
const getEditOfferPage = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).populate('category');
        const categories = await Category.find();
        res.render('admin/editOffer', { title: "Edit Offer", offer, categories, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Update an existing offer
const updateOffer = async (req, res) => {
    try {
        const { name, discount, category, startDate, endDate } = req.body;

        await Offer.findByIdAndUpdate(req.params.id, { name, discount, category, startDate, endDate });

        req.flash('success_msg', 'Offer updated successfully');
        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error updating offer');
        res.redirect('/admin/offers');
    }
};

// Toggle offer status
const toggleOfferStatus = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        const newStatus = offer.status === 'active' ? 'inactive' : 'active';

        offer.status = newStatus;
        await offer.save();

        res.json({ success: true, message: `Offer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating offer status' });
    }
};


// Get all product offers
const getProductOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ product: { $exists: true } }).populate('product');
        res.render('admin/productOffers', { title: "Product Offer List", offers, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Add offer page for products
const getAddProductOfferPage = async (req, res) => {
    try {
        const products = await Product.find();
        res.render('admin/addProductOffer', { title: "Add Product Offer", products, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Add a new product offer
const addProductOffer = async (req, res) => {
    try {
        const { name, discount, product, startDate, endDate } = req.body;

        const newOffer = new Offer({ name, discount, product, startDate, endDate });
        await newOffer.save();

        req.flash('success_msg', 'Product offer added successfully');
        res.redirect('/admin/offers/productOffers');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error adding product offer');
        res.redirect('/admin/offers/productOffers');
    }
};

// Edit offer page for products
const getEditProductOfferPage = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).populate('product');
        const products = await Product.find();
        res.render('admin/editProductOffer', { title: "Edit Product Offer", offer, products, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Update an existing product offer
const updateProductOffer = async (req, res) => {
    try {
        const { name, discount, product, startDate, endDate } = req.body;

        await Offer.findByIdAndUpdate(req.params.id, { name, discount, product, startDate, endDate });

        req.flash('success_msg', 'Product offer updated successfully');
        res.redirect('/admin/offers/productOffers');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error updating product offer');
        res.redirect('/admin/offers/productOffers');
    }
};

// Toggle product offer status
const toggleProductOfferStatus = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const newStatus = offer.status === 'active' ? 'inactive' : 'active';
        offer.status = newStatus;
        await offer.save();

        res.json({ success: true, message: `Offer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating offer status' });
    }
};


module.exports = {
    getOffers,
    getAddOfferPage,
    addOffer,
    getEditOfferPage,
    updateOffer,
    toggleOfferStatus,
    getProductOffers,
    getAddProductOfferPage,
    addProductOffer,
    getEditProductOfferPage,
    updateProductOffer,
    toggleProductOfferStatus
};
