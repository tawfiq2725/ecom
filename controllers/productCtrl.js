const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Return = require('../models/returnSchema')
const Order = require('../models/orderSchema')
// Get All Products
const getProducts = async (req, res) => {
    try {
        if (req.session.admin) { // Corrected typo here
            const products = await Product.find().populate('category');
            res.render('admin/products', { title: "Product List", products, layout: 'adminlayout' });
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Go to Add New Product
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
        const { name, description, price, category, highlights, variants } = req.body;
        const mainImage = req.files.mainImage ? req.files.mainImage[0].filename : '';
        const subImages = req.files.subImages ? req.files.subImages.map(file => file.filename) : [];

        const highlightsArray = highlights.split(',').map(item => item.trim());

        // Parse the variants directly from the request body
        const variantsArray = Object.values(variants).map(variant => ({
            size: variant.size,
            stock: variant.stock,
        }));

        const newProduct = new Product({ 
            name, 
            description, 
            price, 
            category, 
            mainImage, 
            subImages, 
            highlights: highlightsArray, 
            variants: variantsArray
        });

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
        const { name, description, price, category, existingMainImage, existingSubImages, highlights, variants } = req.body;

        // console.log("Received Data:", req.body);
        
        const mainImage = req.files.mainImage ? req.files.mainImage[0].filename : existingMainImage;
        const subImages = req.files.subImages ? req.files.subImages.map(file => file.filename) : existingSubImages.split(',');

        const highlightsArray = highlights.split(',').map(item => item.trim());

        // Parse the variants
        const variantsArray = Object.values(variants).map(variant => ({
            size: variant.size,
            stock: variant.stock,
        }));

        // Ensure to include all required fields in the update
        const updateData = {
            name,
            description,
            price,
            category,
            mainImage,
            subImages,
            highlights: highlightsArray,
            variants: variantsArray // Make sure this is correctly formatted
        };

        // console.log("Update Data:", updateData);

        await Product.findByIdAndUpdate(req.params.id, updateData);

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
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
};

// List and Unlist Product
const toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        product.status = !product.status;
        await product.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
};

const getManageStockPage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.render('admin/manageStock', { title: "Manage Stock", product, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

const updateStock = async (req, res) => {
    try {
        const { variants } = req.body;
        const product = await Product.findById(req.params.id);
        product.variants = variants;
        await product.save();
        
        req.flash('success_msg', 'Stock updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error updating stock');
        res.redirect('/admin/products');
    }
};

const getOrderList = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const orders = await Order.find()
            .populate('user', 'firstname lastname')
            .populate('address')
            .sort({ createdAt: -1 })
            .lean();

        return res.render('admin/ordermanagement', { orders, layout: 'adminlayout', title: "Order Management" });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server Error');
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params; // Ensure this matches the route parameter
        const { orderStatus } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        console.log(`Updating order ${id} status to ${orderStatus}`);
        
        order.orderStatus = orderStatus;

        if (order.paymentMethod === 'COD' && orderStatus === 'Delivered') {
            order.paymentStatus = 'Completed';
        }

        await order.save();

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

const getReturnList = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        const returns = await Return.find()
            .populate('user', 'firstname lastname')
            .populate('order', 'totalAmount')
            .populate('items.product', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return res.render('admin/returnmanagement', { returns, layout: 'adminlayout', title: "Return Management" });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server Error');
    }
};

const updateReturnStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const returnRequest = await Return.findById(id);

        if (!returnRequest) {
            return res.status(404).json({ success: false, message: 'Return request not found' });
        }

        console.log(`Updating return request ${id} status to ${status}`);

        returnRequest.status = status;
        await returnRequest.save();

        res.json({ success: true, message: 'Return request status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};



module.exports = {
    getProducts,
    getAddProductPage,
    addProduct,
    getEditProductPage,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getManageStockPage,
    updateStock,
    getOrderList,
    updateOrderStatus,
    getReturnList,
    updateReturnStatus
};
