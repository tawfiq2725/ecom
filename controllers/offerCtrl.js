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
            layout: 'adminlayout'
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
            return res.redirect('/admin/login');
        }
        
        const { categoryId } = req.body;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // Toggle offerIsActive status
        const newStatus = !category.offerIsActive;
        category.offerIsActive = newStatus;
        await category.save();

        return res.json({ success: true, message: `Offer ${newStatus ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error("Error Occurred:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};


// Inside your controller file
const gotoProductOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const products = await Product.find();
        res.render('admin/productOffers', {
            title: "Product Offer Management",
            products,
            layout: 'adminlayout'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
        console.log("Error Occurred: " + error);
    }
};

const ProductaddOrEditOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
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
        });
        console.log("Error Occurred: " + error);
    }
};

const ProductactivateOffer = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }

        const { productId, isActive } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Set the offerIsActive status
        product.offerIsActive = isActive;
        await product.save();

        return res.json({ success: true, message: `Offer ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error("Error Occurred:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};



module.exports = {
    gotoCategoryOffer,
    addOrEditOffer,
    activateOffer,
    gotoProductOffer,
    ProductaddOrEditOffer,
    ProductactivateOffer
}