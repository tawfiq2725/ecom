const Return = require('../models/returnSchema');
const Order = require('../models/orderSchema');

// Show return form
const showReturnForm = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const orderId = req.params.orderId;
        const userId = req.session.user._id;
        const order = await Order.findOne({ _id: orderId, user: userId }).populate('items.product');

        if (!order || order.orderStatus !== 'Delivered') {
            return res.status(404).json({ success: false, message: 'Order not found or not delivered' });
        }

        const deliveryDate = new Date(order.deliveryDate);
        const currentDate = new Date();
        const twoWeeksInMillis = 7 * 24 * 60 * 60 * 1000;

        if (currentDate - deliveryDate > twoWeeksInMillis) {
            return res.status(400).json({ success: false, message: 'Return period has expired' });
        }

        res.render('user/returnForm', {
            title: "Return Order",
            order
        });
    } catch (error) {
        console.error('Error displaying return form:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Create return request
const createReturnRequest = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.user._id;
        const { orderId, items, reason, note } = req.body;

        // Log the entire request body for debugging
        console.log('Received Request Body:', req.body);
        console.log('userId:', userId);
        console.log('orderId:', orderId);

        const order = await Order.findOne({ _id: orderId, user: userId }).populate('items.product');

        console.log('order:', order);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Return request can only be made for delivered orders' });
        }

        const deliveryDate = new Date(order.deliveryDate);
        const currentDate = new Date();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        if (currentDate - deliveryDate > oneWeek) {
            return res.status(400).json({ success: false, message: 'Return period has expired' });
        }

        const returnItems = (items || []).filter(item => item.selected).map(item => ({
            product: item.product,
            size: item.size,
            quantity: item.quantity,
            price: item.price
        }));

        if (returnItems.length === 0) {
            return res.status(400).json({ success: false, message: 'No items selected for return' });
        }

        const returnRequest = new Return({
            user: userId,
            order: orderId,
            items: returnItems,
            reason,
            note
        });

        await returnRequest.save();

        res.status(201).json({ success: true, message: 'Return request created successfully' });
    } catch (error) {
        console.error('Error creating return request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



// Get all return requests for a user
const getUserReturnRequests = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default to 10 return requests per page
        const skip = (page - 1) * limit;

        const totalReturnRequests = await Return.countDocuments({ user: userId }); // Count total return requests
        const returnRequests = await Return.find({ user: userId })
            .populate('order items.product')
            .sort({ createdAt: -1 }) // Sort return requests by date
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalReturnRequests / limit);

        res.render('user/returns', {
            title: "Return Requests",
            returnRequests,
            currentPage: page,
            totalPages,
            limit
        });
    } catch (error) {
        console.error('Error fetching return requests:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


module.exports = {
    showReturnForm,
    createReturnRequest,
    getUserReturnRequests,

};
