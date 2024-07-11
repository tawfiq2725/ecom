const Category = require('../models/categorySchema')
const Product = require('../models/productSchema')

const gotoCategoryOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            res.redirect('/admin/login')
        }
        const categories = await Category.find()
        res.render('admin/categoryOffer', {
            title: "Category Offer",
            categories,
            layout: 'adminLayout'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
        console.log("Error Occurred: " + error)
    }
}

const addOrEditOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            res.redirect('/admin/login')
        }
        const { offerRate, categoryId } = req.body;
        if (offerRate >= 95) {
            req.flash('error_msg', 'Offer must be below 95%');
            return res.redirect('/admin/category/offers');
        }
        const category = await Category.findById(categoryId);
        category.offerRate = offerRate;
        await category.save();
        req.flash('success_msg', 'Offer added/edited successfully');
        res.redirect('/admin/category/offers');
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
        console.log("Error Occurred: " + error)
    }
}

const activateOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            res.redirect('/admin/login')
        }
        const { categoryId, isActive } = req.body;
        const category = await Category.findById(categoryId);
        category.offerIsActive = isActive;
        await category.save();
        res.json({ success: true, message: `Offer ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
        console.log("Error Occurred: " + error)
    }
}

const gotoProductOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            res.redirect('/admin/login')
        }
        const products = await Product.find()
        res.render('admin/productOffers', {
            title: "Product Offer Management",
            products,
            layout: 'adminLayout'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
        console.log("Error Occurred: " + error)
    }
}

const ProductaddOrEditOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            res.redirect('/admin/login')
        }
        const { offerRate, productId } = req.body;
        if (offerRate >= 95) {
            req.flash('error_msg', 'Offer must be below 95%');
            return res.redirect('/admin/product/offers');
        }
        const product = await Product.findById(productId);
        product.discount = offerRate;
        product.offerPrice = product.price - (product.price * (offerRate / 100));
        await product.save();
        req.flash('success_msg', 'Offer added/edited successfully');
        res.redirect('/admin/product/offers');
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
        console.log("Error Occurred: " + error)
    }
}

const ProductactivateOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            res.redirect('/admin/login')
        }
        const { productId, isActive } = req.body;
        const product = await Product.findById(productId);
        product.offerIsActive = isActive;
        await product.save();
        res.json({ success: true, message: `Offer ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
        console.log("Error Occurred: " + error);
    }
}

module.exports = {
    gotoCategoryOffer,
    addOrEditOffer,
    activateOffer,
    gotoProductOffer,
    ProductaddOrEditOffer,
    ProductactivateOffer
}