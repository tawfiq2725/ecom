const Category = require('../models/categorySchema');

// Fetch all categories
const getCategories = async (req, res) => {
    try {
        if(req.session.admin){
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

// Render the add category page
const getAddCategoryPage = (req, res) => {
    res.render('admin/addCategory', { title: "Add Category", layout: 'adminlayout' });
};

// Add a new category
const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const image = req.file.filename;

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

// Render the edit category page
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

// Delete a category
const deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Category deleted successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error deleting category');
        res.redirect('/admin/categories');
    }
};

module.exports = {
    getCategories,
    getAddCategoryPage,
    addCategory,
    getEditCategoryPage,
    updateCategory,
    deleteCategory
};
