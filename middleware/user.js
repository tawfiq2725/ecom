const User = require('../models/userSchema');

const isBlocked = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.user._id);
        console.log(req.session.user._id);
        if (user && user.status === 'blocked') {
            return res.redirect('/auth/logout');
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};

module.exports = { isBlocked };