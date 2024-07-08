const Offer = require('../models/offerSchema');
const Category = require('../models/categorySchema');

// Display all offers
const getAllOffers = async (req, res) => {
    try {
        const offers = await Offer.find().populate('category');
        res.render('admin/offerManagement', {
            layout: 'adminlayout',
            title: "Offer Management",
            offers: offers
        });
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

// Show form to create a new offer
const getCreateOfferPage = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/createOffer', {
            layout: 'adminlayout',
            title: "Create Offer",
            categories: categories
        });
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

// Create a new offer
const createOffer = async (req, res) => {
    try {
        const { name, discount, category, startDate, endDate } = req.body;

        const newOffer = new Offer({
            name,
            discount,
            category,
            startDate,
            endDate,
            status: 'active'
        });

        await newOffer.save();
        res.redirect('/admin/offers');
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

// Show form to edit an existing offer
const getEditOfferPage = async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId).populate('category');
        const categories = await Category.find();
        res.render('admin/editOffer', {
            layout: 'adminlayout',
            title: "Edit Offer",
            offer: offer,
            categories: categories
        });
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

// Update an existing offer
const updateOffer = async (req, res) => {
    try {
        const offerId = req.params.id;
        const { name, discount, category, startDate, endDate, status } = req.body;

        await Offer.findByIdAndUpdate(offerId, {
            name,
            discount,
            category,
            startDate,
            endDate,
            status
        });

        res.redirect('/admin/offers');
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

// Delete an offer
const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.id;
        await Offer.findByIdAndDelete(offerId);
        res.redirect('/admin/offers');
    } catch (err) {
        console.log(err.message);
        res.redirect('/admin/dashboard');
    }
};

module.exports = {
    getAllOffers,
    getCreateOfferPage,
    createOffer,
    getEditOfferPage,
    updateOffer,
    deleteOffer
};
