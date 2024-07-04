const Order = require('../models/orderSchema');

const getTopCategories = async () => {
    try {
        const categories = await Order.aggregate([
            { $unwind: "$items" },
            { $match: { orderStatus: "Delivered" } },
            {
                $lookup: {
                    from: "products", // Ensure the correct collection name is used
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            { $group: { _id: "$productDetails.category", count: { $sum: "$items.quantity" } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "categories", // Ensure the correct collection name is used
                    localField: "_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    categoryName: { $arrayElemAt: ["$category.name", 0] }
                }
            }
        ]);

        return categories;
    } catch (error) {
        console.error('Error fetching top categories:', error);
        throw error;
    }
};

const getBestSellingProducts = async () => {
    try {
        const products = await Order.aggregate([
            { $unwind: "$items" },
            { $match: { orderStatus: "Delivered" } },
            { $group: { _id: "$items.product", count: { $sum: "$items.quantity" } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products", // Ensure the correct collection name is used
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    productName: { $arrayElemAt: ["$product.name", 0] },
                    productImage: { $arrayElemAt: ["$product.mainImage", 0] }
                }
            }
        ]);

        return products;
    } catch (error) {
        console.error('Error fetching best-selling products:', error);
        throw error;
    }
};

module.exports = {
    getBestSellingProducts,
    getTopCategories
};
