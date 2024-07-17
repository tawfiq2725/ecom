const Razorpay = require('razorpay');
const crypto = require('crypto');
const Wallet = require('../models/walletSchema'); // Assuming these paths are correct
const Transaction = require('../models/transactionSchema');
require('dotenv').config()
// Initialize Razorpay instance with your credentials
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Fetch user's wallet and transaction history
const getWallet = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login'); // Redirect to login if session not found
        }

        const userId = req.session.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default to 10 transactions per page
        const skip = (page - 1) * limit;

        const wallet = await Wallet.findOne({ userId });
        const totalTransactions = await Transaction.countDocuments({ userId }); // Count total transactions
        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 }) // Sort transactions by date
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalTransactions / limit);

        res.render('user/wallet', {
            title: "Wallet",
            wallet: wallet || { balance: 0 },
            transactions,
            currentPage: page,
            totalPages,
            limit,
        });
    } catch (error) {
        console.error('Error fetching wallet data:', error);
        res.status(500).send('Server error');
    }
};


// Render the add money form
const addMoneyForm = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login'); // Redirect to login if session not found
        }

        res.render('user/addmoney', { title: "Add Money" });
    } catch (error) {
        console.error('Error rendering add money form:', error);
        res.status(500).redirect('/login'); // Redirect to login on error
    }
};

// Initiate a Razorpay payment order
const initiatePayment = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login'); // Redirect to login if session not found
        }

        const { amount, note } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const options = {
            amount: amount * 100, // amount in paisa
            currency: 'INR',
            receipt: `receipt_${new Date().getTime()}`,
            notes: {
                description: note || 'Adding money to wallet'
            }
        };

        const order = await razorpayInstance.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Verify the Razorpay payment signature and update the wallet
const verifyPayment = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login'); // Redirect to login if session not found
        }

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, note } = req.body;

        // Generate the expected signature
        const generated_signature = crypto.createHmac('sha256', razorpayInstance.key_secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            try {
                const userId = req.session.user._id;
                let wallet = await Wallet.findOne({ userId });
                if (!wallet) {
                    wallet = new Wallet({ userId, balance: 0, transactions: [] });
                }

                // Update wallet balance and add transaction
                wallet.balance += amount / 100; // Convert from paisa to rupees
                const transaction = new Transaction({
                    userId,
                    amount: amount / 100,
                    description: note || 'Added to wallet',
                    type: 'credit',
                    status: 'completed'
                });

                // Save the transaction and update wallet
                await transaction.save();
                wallet.transactions.push(transaction._id);
                await wallet.save();

                res.json({ success: true, message: 'Payment verified and wallet updated' });
            } catch (error) {
                console.error('Error updating wallet:', error);
                res.status(500).json({ success: false, message: 'Server error' });
            }
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}


module.exports = {
    getWallet,
    addMoneyForm,
    initiatePayment,
    verifyPayment
};
