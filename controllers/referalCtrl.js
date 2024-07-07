const User = require('../models/userSchema');
const Wallet = require('../models/walletSchema');
const Transaction = require('../models/transactionSchema');

// Handle referral logic when a new user registers
const handleReferral = async (referralCode, newUser) => {
    try {
        if (!referralCode) return;

        // Find the referrer
        const referringUser = await User.findOne({ referralCode });
        if (!referringUser) return;

        // Add referral to referrer's list
        referringUser.referrals.push(newUser._id);
        await referringUser.save();

        // Reward the referrer
        const rewardAmount = 250; // Rs. 250 for the referrer
        const referrerWallet = await Wallet.findOne({ userId: referringUser._id });
        if (referrerWallet) {
            referrerWallet.balance += rewardAmount;
            const transaction = new Transaction({
                userId: referringUser._id,
                amount: rewardAmount,
                description: 'Referral reward',
                type: 'credit',
            });
            await transaction.save();
            referrerWallet.transactions.push(transaction._id);
            await referrerWallet.save();
        }

        // Create wallet for the new user
        const newUserWallet = new Wallet({ userId: newUser._id });
        await newUserWallet.save();
        
    } catch (error) {
        console.error('Error handling referral:', error);
    }
};

// Fetch referrals for a user
const getUserReferrals = async (req, res) => {
    try {
        if(!req.session.user){
            return res.redirect('/login');
        }
        const userId = req.session.user._id;
        const referrals = await User.find({ referredBy: userId }).populate('referrals');

        res.render('user/referrals', { referrals });
    } catch (error) {
        console.error('Error fetching referrals:', error);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    handleReferral,
    getUserReferrals
};
