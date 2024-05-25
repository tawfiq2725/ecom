const User = require('../models/userSchema');

const checkUserStatus = async (req, res, next) => {
    if (req.session && req.session.user) {
        try {
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
        } catch (error) {
            console.log(error.message);
            return res.status(500).send("An error occurred while checking user status.");
        }
    } else {
        next();
    }
};

module.exports = checkUserStatus;