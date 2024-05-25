const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');

// Get All Products

const getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.render('admin/products', { title: "Product List", products, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

//Go to Add New Product
const getAddProductPage = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/addProduct', { title: "Add Product", categories, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Add New Product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category } = req.body;
        const mainImage = req.files.mainImage[0].filename;
        const subImages = req.files.subImages ? req.files.subImages.map(file => file.filename) : [];

        const newProduct = new Product({ name, description, price, stock, category, mainImage, subImages });
        await newProduct.save();

        req.flash('success_msg', 'Product added successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error adding product');
        res.redirect('/admin/products');
    }
};

// Edit Product
const getEditProductPage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        const categories = await Category.find();
        res.render('admin/editProduct', { title: "Edit Product", product, categories, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Update Product
const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, existingMainImage, existingSubImages } = req.body;
        const mainImage = req.files.mainImage ? req.files.mainImage[0].filename : existingMainImage;
        const subImages = req.files.subImages ? req.files.subImages.map(file => file.filename) : existingSubImages.split(',');

        await Product.findByIdAndUpdate(req.params.id, { name, description, price, stock, category, mainImage, subImages });

        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error updating product');
        res.redirect('/admin/products');
    }
};

// Delete Product
const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error deleting product');
        res.redirect('/admin/products');
    }
};

// List and UnList 
const toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        product.status = !product.status;
        await product.save();
        req.flash('success_msg', 'Product status updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error toggling product status');
        res.redirect('/admin/products');
    }
};

module.exports = {
    getProducts,
    getAddProductPage,
    addProduct,
    getEditProductPage,
    updateProduct,
    deleteProduct,
    toggleProductStatus
};
