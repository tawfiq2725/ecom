const User = require('../models/userSchema');
const Admin = require('../models/adminSchema');
const Product = require('../models/productSchema');
const mongoose = require('mongoose');
const checkUserStatus = async (req, res, next) => {
    if (req.session && (req.session.user || req.session.admin)) {
        try {
            if (req.session.user) {
                const user = await User.findById(req.session.user._id);
                if (user && user.isBlocked) {
                    req.session.destroy((err) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send("An error occurred during logout.");
                        }
                        return res.render('user/login', { error_msg: "Your account has been blocked by the admin. Please contact support." });
                    });
                } else {
                    next();
                }
            }
            else if (req.session.admin) {
                const admin = await Admin.findById(req.session.admin._id);
                if (admin && admin.isAdmin) {
                    // If admin is logged in, allow access
                    next();
                } else {
                    req.session.destroy((err) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send("An error occurred during logout.");
                        }
                        return res.redirect('/admin/login');
                    });
                }
            }
            else {
                next();
            }
        } catch (error) {
            console.log(error.message);
            return res.status(500).send("An error occurred while checking user status.");
        }
    }
    else {
        next();
    }
};



const checkProductExists = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // Check if productId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(404).render('user/productNotFound', {
                title: "Product Not Found",
                admin: req.session.admin
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).render('user/productNotFound', {
                title: "Product Not Found",
                admin: req.session.admin
            });
        }

        req.product = product;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};



module.exports = {
    checkUserStatus,
    checkProductExists
};
