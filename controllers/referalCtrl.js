const User = require('../models/userSchema');
const Wallet = require('../models/walletSchema');
const Transaction = require('../models/transactionSchema');

// Handle referral logic when a new user registers
const handleReferral = async (referralCode, newUser) => {
    try {
        if (!referralCode) {
            newUser.isEligibleForReferralReward = false;
            await newUser.save();
            return;
        }

        const referringUser = await User.findOne({ referralCode });
        if (!referringUser) {
            newUser.isEligibleForReferralReward = false;
            await newUser.save();
            return;
        }

        referringUser.referrals.push(newUser._id);
        await referringUser.save();

        const rewardAmount = 250; // Rs. 250 for the referrer
        let referrerWallet = await Wallet.findOne({ userId: referringUser._id });
        if (!referrerWallet) {
            referrerWallet = new Wallet({ userId: referringUser._id, balance: rewardAmount });
        } else {
            referrerWallet.balance += rewardAmount;
        }

        const transaction = new Transaction({
            userId: referringUser._id,
            amount: rewardAmount,
            description: 'Referral reward',
            type: 'credit',
        });
        await transaction.save();
        referrerWallet.transactions.push(transaction._id);
        await referrerWallet.save();

        newUser.isEligibleForReferralReward = true;
        await newUser.save();
    } catch (error) {
        console.error('Error handling referral:', error);
    }
};

// Fetch referrals for a user
const getUserReferrals = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userId = req.session.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default to 10 referrals per page
        const skip = (page - 1) * limit;

        const totalReferrals = await User.countDocuments({ referredBy: userId });
        const referrals = await User.find({ referredBy: userId })
            .populate('referrals')
            .sort({ createdAt: -1 }) // Sort referrals by date
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalReferrals / limit);

        res.render('user/referrals', {
            referrals,
            title: "My Referrals",
            currentPage: page,
            totalPages,
            limit
        });
    } catch (error) {
        console.error('Error fetching referrals:', error);
        res.status(500).send('Server Error');
    }
};



module.exports = {
    handleReferral,
    getUserReferrals
};
