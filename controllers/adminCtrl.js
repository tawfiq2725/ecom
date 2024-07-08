const Order = require('../models/orderSchema');
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const bestSelling = require('../helpers/topSelling');
const Admin = require('../models/adminSchema');
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
require('dotenv').config();

const getSaleChartData = async (filter) => {
    let matchStage = {};
    if (filter === 'monthly') {
        matchStage = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } };
    } else if (filter === 'weekly') {
        matchStage = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } };
    }

    const orders = await Order.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSales: { $sum: "$totalAmount" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.totalSales);

    return {
        labels,
        datasets: [{
            label: 'Sales',
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };
};

const getOrderTypeChartData = async (filter) => {
    let matchStage = {};
    if (filter === 'monthly') {
        matchStage = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } };
    } else if (filter === 'weekly') {
        matchStage = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } };
    }

    const orders = await Order.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: "$paymentMethod",
                count: { $sum: 1 }
            }
        }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.count);

    return {
        labels,
        datasets: [{
            label: 'Order Types',
            data,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };
};

const getCategoryChartData = async (filter) => {
    let matchStage = {};
    if (filter === 'monthly') {
        matchStage = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } };
    } else if (filter === 'weekly') {
        matchStage = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } };
    }

    const categories = await Product.aggregate([
        { $lookup: { from: 'orders', localField: '_id', foreignField: 'items.product', as: 'orders' } },
        { $unwind: "$orders" },
        { $match: matchStage },
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryDetails' } },
        { $unwind: "$categoryDetails" }
    ]);

    const labels = categories.map(category => category.categoryDetails.name);
    const data = categories.map(category => category.count);

    return {
        labels,
        datasets: [{
            label: 'Categories',
            data,
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
        }]
    };
};

const getOrderQuantityChartData = async (filter) => {
    let matchStage = {};
    if (filter === 'monthly') {
        matchStage = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } };
    } else if (filter === 'weekly') {
        matchStage = { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } };
    }

    const orders = await Order.aggregate([
        { $match: matchStage },
        { $unwind: "$items" },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalQuantity: { $sum: "$items.quantity" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.totalQuantity);

    return {
        labels,
        datasets: [{
            label: 'Order Quantity',
            data,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
};


// Home Page
const getHomePage = async (req, res) => {
    try {
        const filter = req.query.filter || 'yearly'; // Default to yearly if no filter is provided

        // Fetch chart data
        const saleChartInfo = await getSaleChartData(filter);
        const orderTypeChartInfo = await getOrderTypeChartData(filter);
        const categoryChartInfo = await getCategoryChartData(filter);
        const orderQuantityChartInfo = await getOrderQuantityChartData(filter);

        // If the request is for charts data (AJAX request)
        if (req.xhr) {
            return res.json({
                saleChartInfo,
                orderTypeChartInfo,
                categoryChartInfo,
                orderQuantityChartInfo
            });
        }

        // Fetch total counts
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
        const totalRevenue = await Order.aggregate([
            { $match: { orderStatus: 'Delivered' } }, // Only include delivered orders
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        res.render('admin/dashboard', {
            title: "Hossom Dashboard",
            layout: 'adminlayout',
            admin: req.session.admin,
            topCategories: await bestSelling.getTopCategories(),
            bestsellingProducts: await bestSelling.getBestSellingProducts(),
            saleChartInfo,
            orderTypeChartInfo,
            categoryChartInfo,
            orderQuantityChartInfo,
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        console.log("Something went wrong: " + error);
        res.status(500).send("Server error");
    }
};


// Login Page

const getLoginPage = async (req, res) => {
    try {
        const locals={
            title:`Admin Login Page`
        }
        if(!req.session.admin){

            res.render("admin/login",{title:locals.title,layout:'adminlayout'})
        }
        else{
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
        const locals={
            title:`Admin Sign Up Page`
        }
        if(!req.session.admin){

            res.render("admin/signup",{title:locals.title,layout:'adminlayout'})
        }
        else{
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
            return res.render("admin/signup", { error_msg: "The confirm password does not match.", firstname, lastname, email, mobile,layout:'adminlayout' });
        }

        // Check if the user already exists
        const findAdmin = await Admin.findOne({ email });
        if (findAdmin) {
            return res.render("admin/signup", { error_msg: "Admin with this email already exists.", firstname, lastname, email, mobile,layout:'adminlayout'});
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds); 
        // Create and save the new user
        const newAdmin = new Admin({
            firstname:firstname,
            lastname:lastname,
            mobile:mobile,
            email:email,
            password:hashedPassword,
            isAdmin: true
        });

        const savedAdmin = await newAdmin.save();
        console.log(savedAdmin)
        res.render('admin/login',{layout:'adminlayout'})
    } catch (error) {
        res.status(500).render("admin/signup", { error_msg: "An error occurred during registration.", firstname, lastname, email, mobile , layout:'adminlayout' });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.render("admin/login", { message: "Invalid email or password.", layout:'adminlayout'});
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.render("admin/login", { message: "Invalid email or password." ,layout:'adminlayout'});
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
                res.render('admin/dashboard',{layout:'adminlayout'})
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
    unblockUser
}