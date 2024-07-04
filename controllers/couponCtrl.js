const Coupon = require('../models/couponSchema'); // Adjust the path as necessary

// List all coupons
const listCoupons = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const coupons = await Coupon.find().lean();
        res.render('admin/couponmanagement', { coupons, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Show add coupon form
const showAddCouponForm = (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    res.render('admin/addcoupon', { layout: 'adminlayout' });
};

// Add a new coupon
const addCoupon = async (req, res) => {
    try {
        const { code, minPurchaseAmount, discountRate, maxDiscount, expiryDate } = req.body;

        // Check if the coupon code already exists
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.redirect(`/admin/coupons?error=The coupon code already exists`);
        }

        // Create a new coupon
        const newCoupon = new Coupon({
            code,
            minPurchaseAmount,
            discountRate,
            maxDiscount,
            expiryDate
        });
        await newCoupon.save();
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Show edit coupon form
const showEditCouponForm = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const { id } = req.params;
        const coupon = await Coupon.findById(id).lean();
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }
        res.render('admin/editcoupon', { coupon, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Edit an existing coupon
const editCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, minPurchaseAmount, discountRate, maxDiscount, expiryDate, status } = req.body;
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }
        coupon.code = code;
        coupon.minPurchaseAmount = minPurchaseAmount;
        coupon.discountRate = discountRate;
        coupon.maxDiscount = maxDiscount;
        coupon.expiryDate = expiryDate;
        coupon.status = status;
        await coupon.save();
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const listCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, { status: 'Active' }, { new: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Unlist (Deactivate) Coupon
const unlistCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, { status: 'Inactive' }, { new: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
module.exports = {
    listCoupons,
    showAddCouponForm,
    addCoupon,
    showEditCouponForm,
    editCoupon,
    listCoupon,
    unlistCoupon
};
