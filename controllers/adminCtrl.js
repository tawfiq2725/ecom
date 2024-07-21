const Order = require('../models/orderSchema');
const Product = require('../models/productSchema');
const {getDateRange} = require('../helpers/chart');
const bestSelling = require('../helpers/topSelling');
const Admin = require('../models/adminSchema');
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
require('dotenv').config();


const ChartCtrl =  async (req, res) => {
    const { filterType,dateRange, filterDate } = req.query;

    console.log(`Received request for filterType=${filterType},dateRange=${dateRange}, filterDate=${filterDate}`);

    try {
        let data;
        if (filterType === 'products') {
            data = await getProductOrderAnalysis(dateRange, filterDate);
        } else {
            data = await getCategoryOrderAnalysis(dateRange, filterDate);
        }

        console.log('Sending data:', data);
        res.json(data);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Updated function for product order analysis
async function getProductOrderAnalysis(dateRange, filterDate) {
    const { startDate, endDate } = getDateRange(dateRange, filterDate);

    const orders = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $unwind: '$items' },
        { $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
        }},
        { $unwind: '$productDetails' },
        { $group: {
            _id: '$productDetails.name',
            totalQuantity: { $sum: '$items.quantity' }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.totalQuantity);

    return { labels, orders: data };
}

// Updated function for category order analysis
async function getCategoryOrderAnalysis(dateRange, filterDate) {
    const { startDate, endDate } = getDateRange(dateRange, filterDate);

    const orders = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $unwind: '$items' },
        { $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
        }},
        { $unwind: '$productDetails' },
        { $lookup: {
            from: 'categories',
            localField: 'productDetails.category',
            foreignField: '_id',
            as: 'categoryDetails'
        }},
        { $unwind: '$categoryDetails' },
        { $group: {
            _id: '$categoryDetails.name',
            totalQuantity: { $sum: '$items.quantity' }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.totalQuantity);

    return { labels, orders: data };
}



// Home Page
const getHomePage = async (req, res) => {
    try {
        if (!req.session.admin) {
            console.log("Redirecting to login");
            return res.redirect('/admin/login');
        }
        // Fetch other data needed for the dashboard rendering
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
        const totalRevenue = await Order.aggregate([
            { $match: { orderStatus: 'Delivered' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        // Render the dashboard view with all necessary data
        console.log("Rendering dashboard view");
        return res.render('admin/dashboard', {
            title: "Hossom Dashboard",
            layout: 'adminlayout',
            admin: req.session.admin,
            topCategories: await bestSelling.getTopCategories(),
            bestsellingProducts: await bestSelling.getBestSellingProducts(),
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);

        if (req.xhr) {
            console.log("Sending JSON error response for AJAX request");
            return res.status(500).json({ error: "Server error" });
        }
        console.log("Sending HTML error response");
        return res.status(500).send("Server error");
    }
};

// Login Page

const getLoginPage = async (req, res) => {
    try {
        const locals = {
            title: `Admin Login Page`
        }
        if (!req.session.admin) {

            res.render("admin/login", { title: locals.title, layout: 'adminlayout' })
        }
        else {
            res.redirect('/admin/dashboard');
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

//Go to Signup Page

const getSignupPage = async (req, res) => {
    try {
        const locals = {
            title: `Admin Sign Up Page`
        }
        if (!req.session.admin) {

            res.render("admin/signup", { title: locals.title, layout: 'adminlayout' })
        }
        else {
            res.render('/dashboard');
        }

    }
    catch (error) {
        console.log(error.message);
    }
}

// Register New Member
const newUserRegistration = async (req, res) => {
    try {
        const { firstname, lastname, mobile, email, password, password2 } = req.body;

        // Check if the passwords match
        if (password !== password2) {
            return res.render("admin/signup", { error_msg: "The confirm password does not match.", firstname, lastname, email, mobile, layout: 'adminlayout' });
        }

        // Check if the user already exists
        const findAdmin = await Admin.findOne({ email });
        if (findAdmin) {
            return res.render("admin/signup", { error_msg: "Admin with this email already exists.", firstname, lastname, email, mobile, layout: 'adminlayout' });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Create and save the new user
        const newAdmin = new Admin({
            firstname: firstname,
            lastname: lastname,
            mobile: mobile,
            email: email,
            password: hashedPassword,
            isAdmin: true
        });

        const savedAdmin = await newAdmin.save();
        console.log(savedAdmin)
        res.render('admin/login', { layout: 'adminlayout' })
    } catch (error) {
        res.status(500).render("admin/signup", { error_msg: "An error occurred during registration.", firstname, lastname, email, mobile, layout: 'adminlayout' });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.render("admin/login", { message: "Invalid email or password.", layout: 'adminlayout' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.render("admin/login", { message: "Invalid email or password.", layout: 'adminlayout' });
        }
        // Set user session
        req.session.admin = admin;
        return res.redirect("/admin/dashboard");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred during login.");
    }
};

// Logout user
const logoutUser = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err.message);
                res.render('admin/dashboard', { layout: 'adminlayout' })
                return res.status(500).send("An error occurred during logout.");
            }
            res.redirect('/admin/login');
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred during logout.");
    }
};

// User Management
const getAllUsers = async (req, res) => {
    try {
        if (req.session.admin) {
            const allUsers = await User.find();
            res.render('admin/userManagement', {
                layout: 'adminlayout',
                title: "User Management Page",
                users: allUsers
            });
        } else {
            res.redirect('/admin/login');
        }
    } catch (err) {
        console.log('Some Error ' + err);
        res.redirect('/admin/dashboard'); // Redirect to a safe location if there's an error
    }
};

// Block User

const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndUpdate(userId, { isBlocked: true });
        res.redirect('/admin/userm');
    } catch (error) {
        console.error('Error blocking user:', error);
        res.redirect('/admin/userm');
    }
};

// Unblock User

const unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndUpdate(userId, { isBlocked: false });
        res.redirect('/admin/userm');
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.redirect('/admin/userm');
    }
};




module.exports = {
    getLoginPage,
    getHomePage,
    getSignupPage,
    newUserRegistration,
    loginUser,
    logoutUser,
    getAllUsers,
    blockUser,
    unblockUser,
    ChartCtrl
}