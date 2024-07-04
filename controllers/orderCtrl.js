// orderCtrl.js
const Order = require('../models/orderSchema');
const Cart = require('../models/cartSchema');
const Address = require('../models/addressSchema');
const Product = require('../models/productSchema');
const Coupon = require('../models/couponSchema')
const Wallet = require('../models/walletSchema')
const Transaction = require('../models/transactionSchema')
const Razorpay = require('razorpay')
// Create a new order
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
const checkout = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.user._id;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        const addresses = await Address.find({ userId: userId });
        const razorKeyId = process.env.RAZORPAY_KEY_ID;

        if (!cart) {
            return res.redirect('/cart'); // Redirect to cart if it's empty
        }

        let totalPrice = cart.totalPrice;
        let couponDetails = null;

        // Check if there's a coupon applied in the session
        if (req.session.coupon) {
            couponDetails = req.session.coupon;
            totalPrice -= parseFloat(req.session.coupon.discountAmount);
        }

        res.render('user/checkout', {
            title: "Checkout",
            cart,
            addresses,
            totalPrice: totalPrice.toFixed(2),
            razorKeyId,
            user: req.session.user,
            couponDetails // Pass coupon details to the view
        });
    } catch (error) {
        console.error('Error rendering checkout page:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create Order (modified to handle different payment methods)
const createOrder = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.user._id;
        const { addressId, paymentMethod, place, houseNumber, street, city, zipcode, country, couponCode } = req.body;

        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty' });
        }

        let address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price
        }));

        let totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discountAmount = 0;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (coupon && coupon.status === 'Active') {
                discountAmount = Math.min(coupon.discountRate / 100 * totalAmount, coupon.maxDiscount);
                totalAmount -= discountAmount;
                coupon.usedBy += 1;
                await coupon.save();
            } else {
                return res.status(400).json({ success: false, message: 'Invalid or inactive coupon' });
            }
        }

        // Check if payment method is Wallet
        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet || wallet.balance < totalAmount) {
                return res.status(400).json({ success: false, message: 'Insufficient balance in wallet' });
            }

            // Deduct amount from wallet balance
            wallet.balance -= totalAmount;
            const transaction = new Transaction({
                userId,
                amount: totalAmount,
                description: 'Order payment',
                type: 'debit',
                status: 'completed'
            });

            // Save transaction and update wallet
            await transaction.save();
            wallet.transactions.push(transaction._id);
            await wallet.save();
        }

        const order = new Order({
            user: userId,
            items: orderItems,
            totalAmount,
            discountAmount,
            address: address._id,
            paymentMethod,
            paymentStatus: paymentMethod === 'Wallet' ? 'Paid' : 'Pending',
            orderStatus: 'Pending',
            coupon: couponCode ? { code: couponCode, discountAmount } : undefined
        });

        await order.save();

        // Only reset cart and update product stock if payment method is Wallet and payment is successful
        if (paymentMethod === 'Wallet') {
            for (const item of cart.items) {
                const product = await Product.findById(item.product._id);
                const variant = product.variants.find(v => v.size === item.size);
                if (variant) {
                    variant.stock -= item.quantity;
                }
                await product.save();
            }

            cart.items = [];
            cart.totalPrice = 0;
            await cart.save();
        }

        // Handle different payment methods response
        if (paymentMethod === 'Razorpay') {
            res.json({
                success: true,
                razorpayOrderId: order.razorpayOrderId,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                totalAmount,
                user: req.session.user,
                address
            });
        } else {
            res.status(201).redirect('/confirm');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { addressId, paymentMethod, couponCode } = req.body;

        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty' });
        }

        let address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price
        }));

        let totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discountAmount = 0;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (coupon && coupon.status === 'Active') {
                discountAmount = Math.min(coupon.discountRate / 100 * totalAmount, coupon.maxDiscount);
                totalAmount -= discountAmount;
                coupon.usedBy += 1;
                await coupon.save();
            } else {
                return res.status(400).json({ success: false, message: 'Invalid or inactive coupon' });
            }
        }

        const options = {
            amount: totalAmount * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: `order_rcptid_${userId}`
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        if (!razorpayOrder) {
            return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
        }

        const order = new Order({
            user: userId,
            items: orderItems,
            totalAmount,
            discountAmount,
            address: address._id,
            paymentMethod,
            paymentStatus: 'Pending',
            orderStatus: 'Pending',
            razorpayOrderId: razorpayOrder.id,
            coupon: couponCode ? { code: couponCode, discountAmount } : undefined
        });

        await order.save();

        res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            totalAmount,
            user: req.session.user,
            address
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Confirm Razorpay Payment
const confirmRazorpayPayment = async (req, res) => {
    try {
        const { razorpayPaymentId, razorpayOrderId } = req.body;
        const order = await Order.findOne({ razorpayOrderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentStatus = 'Paid';
        order.razorpayPaymentId = razorpayPaymentId;
        await order.save();

        const cart = await Cart.findOne({ user: order.user }).populate('items.product');
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);
            const variant = product.variants.find(v => v.size === item.size);
            if (variant) {
                variant.stock -= item.quantity;
            }
            await product.save();
        }

        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();

        res.status(200).json({ success: true, message: 'Payment confirmed and order completed' });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Verify Razorpay Payment
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentStatus = 'Paid';
        order.orderStatus = 'Pending';
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



const orderConfirm = async (req, res) => {
    try {
        if (!req.session.user) {
            res.redirect('/login');
        } else {
            res.render('user/confirm', { title: "Order Confirm" });
        }
    } catch (error) {
        res.redirect('/login');
    }
};

// Get details of a specific order
const getOrderDetails = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const orderId = req.params.id;
        const userId = req.session.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('items.product')
            .populate('address');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.render('user/order-details', {
            title: "Order Details",
            order
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all orders for a user
const getUserOrders = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.session.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const orders = await Order.find({ user: userId })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalOrders = await Order.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('user/order', {
            orders,
            currentPage: page,
            totalPages,
            limit
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server error');
    }
};

// Cancel an order
const cancelOrder = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const orderId = req.params.id;
        const userId = req.session.user._id;

        // Find the order
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if order can be cancelled
        if (order.orderStatus !== 'Pending' && order.orderStatus !== 'Processing') {
            return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
        }

        // Set order status to 'Cancelled'
        order.orderStatus = 'Cancelled';

        // Handle refund based on payment method
        if (order.paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                return res.status(400).json({ success: false, message: 'User wallet not found' });
            }
            // Refund the amount to the wallet
            wallet.balance += order.totalAmount;

            // Create a new transaction for the refund
            const transaction = new Transaction({
                userId,
                amount: order.totalAmount,
                description: 'Order refund',
                type: 'credit',
                status: 'completed'
            });

            await transaction.save();
            wallet.transactions.push(transaction._id);
            await wallet.save();
        } else if (order.paymentMethod === 'Razorpay') {
            if (!order.razorpayPaymentId) {
                return res.status(400).json({ success: false, message: 'Payment ID is missing for Razorpay refund' });
            }

            try {
                // Fetch the payment details from Razorpay
                const razorpayPayment = await razorpayInstance.payments.fetch(order.razorpayPaymentId);

                // Check if already refunded
                if (razorpayPayment.status === 'refunded' || razorpayPayment.amount_refunded >= razorpayPayment.amount) {
                    return res.status(400).json({ success: false, message: 'The payment has already been fully refunded' });
                }

                // Initiate the refund
                const refund = await razorpayInstance.payments.refund(razorpayPayment.id, {
                    amount: razorpayPayment.amount
                });

                if (refund) {
                    // Handle refund success
                    const wallet = await Wallet.findOne({ userId });
                    if (!wallet) {
                        return res.status(400).json({ success: false, message: 'User wallet not found' });
                    }
                    wallet.balance += order.totalAmount;

                    const transaction = new Transaction({
                        userId,
                        amount: order.totalAmount,
                        description: 'Order refund',
                        type: 'credit',
                        status: 'completed'
                    });

                    await transaction.save();
                    wallet.transactions.push(transaction._id);
                    await wallet.save();
                } else {
                    console.error('Refund failed:', refund);
                    return res.status(500).json({ success: false, message: 'Refund failed' });
                }
            } catch (error) {
                console.error('Error processing Razorpay refund:', error);
                if (error.statusCode === 400 && error.error && error.error.description === 'The payment has been fully refunded already') {
                    return res.status(400).json({ success: false, message: 'The payment has already been fully refunded' });
                }
                return res.status(500).json({ success: false, message: 'Razorpay refund error' });
            }
        }

        // Save the order update
        await order.save();
        res.status(200).json({ success: true, message: 'Order cancelled and refunded successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user._id;

        console.log(`Applying coupon for user: ${userId} with code: ${couponCode}`); // Debug log

        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
            console.log('Invalid coupon code:', couponCode); // Debug log
            return res.status(400).json({ success: false, message: 'Invalid coupon' });
        }

        if (coupon.status !== 'Active') {
            console.log('Inactive coupon code:', couponCode); // Debug log
            return res.status(400).json({ success: false, message: 'Inactive coupon' });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            console.log('Empty cart for user:', userId); // Debug log
            return res.status(400).json({ success: false, message: 'Your cart is empty' });
        }

        let totalAmount = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // Check minimum purchase amount
        if (totalAmount < coupon.minPurchaseAmount) {
            console.log('Minimum purchase amount not met:', totalAmount); // Debug log
            return res.status(400).json({ success: false, message: `Minimum purchase amount is $${coupon.minPurchaseAmount}` });
        }

        const discountAmount = Math.min(coupon.discountRate / 100 * totalAmount, coupon.maxDiscount);
        totalAmount -= discountAmount;

        // Store coupon in session
        req.session.coupon = {
            code: couponCode,
            discountAmount,
            newTotal: totalAmount
        };

        console.log(`Coupon applied successfully. New total: ${totalAmount}, Discount: ${discountAmount}`); // Debug log
        res.status(200).json({ success: true, newTotal: totalAmount.toFixed(2), discountAmount: discountAmount.toFixed(2) });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user._id;

        console.log(`Removing coupon for user: ${userId}`); // Debug log

        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            console.log('Empty cart for user:', userId); // Debug log
            return res.status(400).json({ success: false, message: 'Your cart is empty' });
        }

        let totalAmount = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // Clear coupon from session
        delete req.session.coupon;

        console.log(`Coupon removed successfully. New total: ${totalAmount}`); // Debug log
        res.status(200).json({ success: true, totalAmount: totalAmount.toFixed(2) });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};




module.exports = {
    checkout,
    createOrder,
    createRazorpayOrder,
    confirmRazorpayPayment,
    verifyRazorpayPayment,
    orderConfirm,
    getOrderDetails,
    getUserOrders,
    cancelOrder,
    applyCoupon,
    removeCoupon
};