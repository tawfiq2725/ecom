const Admin = require('../models/adminSchema');
require('dotenv').config()
const bcrypt = require('bcrypt')


// Home Page

const getHomePage = async (req, res) => {
    try {
        const locals = { title: "Hosssom Dashboard" };
        if(req.session.admin){
            res.render('admin/dashboard', { title: locals.title , layout:'adminlayout' });
        }
        else{
            res.render('admin/login', {layout:'adminlayout'});
        }
    } catch (error) {
        console.log("Something went wrong: " + error);
    }
}



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
            res.render('admin/dashboard',{layout:'adminlayout'});
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
            res.render('admin/dashboard',{layout:'adminlayout'});
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
        return res.render("admin/dashboard",{layout:'adminlayout'});
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
            res.render('admin/login',{layout:'adminlayout'});
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred during logout.");
    }
};


module.exports = {
    getLoginPage,
    getHomePage,
    getSignupPage,
    newUserRegistration,
    loginUser,
    logoutUser
}