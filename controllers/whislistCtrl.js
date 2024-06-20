const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Wishlist = require('../models/whislistSchema');

// Add to wishlist
const addToWishlist = async (req, res) => {
    try {
        if(!req.session.user){
            res.redirect('/login')
        }
        else{
         
            const userId = req.session.user._id;
            const { productId } = req.body;
    
            let wishlist = await Wishlist.findOne({ user: userId });
            if (!wishlist) {
                wishlist = new Wishlist({ user: userId, products: [productId] });
            } else {
                wishlist.products.addToSet(productId);
            }
    
            await wishlist.save();
    
            res.json({ success: true, message: 'Product added to wishlist' });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        if(!req.session.user){
            res.redirect('/login')
        }
        else{
            
            const userId = req.session.user._id;
            const { productId } = req.body;
    
            const wishlist = await Wishlist.findOne({ user: userId });
            if (wishlist) {
                wishlist.products.pull(productId);
                await wishlist.save();
            }
    
            res.json({ success: true, message: 'Product removed from wishlist' });
        }
       
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get wishlist page
const getWishlistPage = async (req, res) => {
    try {
        if(!req.session.user){
            res.redirect('/login')
        }
        else{
           
            const userId = req.session.user._id;
            const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
    
            res.render('user/wishlist', { title: 'My Wishlist', wishlist: wishlist ? wishlist.products : [] });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

module.exports = { addToWishlist, removeFromWishlist, getWishlistPage };
