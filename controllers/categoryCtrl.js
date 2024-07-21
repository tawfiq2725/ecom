const Category = require('../models/categorySchema');
const Product = require('../models/productSchema');

// Get All categories
const getCategories = async (req, res) => {
    try {
        if (req.session.admin) {
            const categories = await Category.find();
            res.render('admin/categories', { title: "Category List", categories, layout: 'adminlayout' });
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Add category page
const getAddCategoryPage = (req, res) => {
    res.render('admin/addCategory', { title: "Add Category", layout: 'adminlayout' });
};

// Add a new category
const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const image = req.file.filename;

        // Check if category name already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            req.flash('error_msg', 'Category name already exists');
            return res.redirect('/admin/categories'); // Redirect to the add category page
        }

        const newCategory = new Category({ name, description, image });
        await newCategory.save();

        req.flash('success_msg', 'Category added successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error adding category');
        res.redirect('/admin/categories');
    }
};


// Edit category page
const getEditCategoryPage = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        res.render('admin/editCategory', { title: "Edit Category", category, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Update an existing category
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const image = req.file ? req.file.filename : req.body.existingImage;

        await Category.findByIdAndUpdate(req.params.id, { name, description, image });

        req.flash('success_msg', 'Category updated successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error updating category');
        res.redirect('/admin/categories');
    }
};

// Soft delete (list/unlist) a category
const toggleCategoryStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        const newStatus = category.status === 'active' ? 'inactive' : 'active';

        category.status = newStatus;
        await category.save();

        // Update the status of all products under this category
        await Product.updateMany({ category: category._id }, { status: newStatus === 'active' });

        res.json({ success: true, message: `Category ${newStatus === 'active' ? 'listed' : 'unlisted'} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating category status' });
    }
};


module.exports = {
    getCategories,
    getAddCategoryPage,
    addCategory,
    getEditCategoryPage,
    updateCategory,
    toggleCategoryStatus
};
