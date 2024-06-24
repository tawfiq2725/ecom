// controllers/offerController.js
const Offer = require('../models/offerSchema');
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
// Get All Offers
const getOffers = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const offers = await Offer.find().populate('product').populate('category');
        res.render('admin/offers', { title: "Offer List", offers, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Get Add Offer Page
const getAddOfferPage = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const products = await Product.find();
        const categories = await Category.find();
        res.render('admin/addOffer', { title: "Add Offer", products, categories, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Add New Offer
const addOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const { name, discount, startDate, endDate, type, product, category } = req.body;

        const newOffer = new Offer({
            name,
            discount,
            startDate,
            endDate,
            type,
            product: type === 'product' ? product : null,
            category: type === 'category' ? category : null
        });

        await newOffer.save();

        req.flash('success_msg', 'Offer added successfully');
        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error adding offer');
        res.redirect('/admin/offers');
    }
};

// Get Edit Offer Page
const getEditOfferPage = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const offer = await Offer.findById(req.params.id);
        const products = await Product.find();
        const categories = await Category.find();
        res.render('admin/editOffer', { title: "Edit Offer", offer, products, categories, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Update Offer
const updateOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const { name, discount, startDate, endDate, type, product, category } = req.body;

        const updateData = {
            name,
            discount,
            startDate,
            endDate,
            type,
            product: type === 'product' ? product : null,
            category: type === 'category' ? category : null
        };

        await Offer.findByIdAndUpdate(req.params.id, updateData);

        req.flash('success_msg', 'Offer updated successfully');
        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error updating offer');
        res.redirect('/admin/offers');
    }
};

// Delete Offer
const deleteOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
};

module.exports = {
    getOffers,
    getAddOfferPage,
    addOffer,
    getEditOfferPage,
    updateOffer,
    deleteOffer
};