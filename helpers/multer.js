const multer = require('multer');
const path = require('path');

// Storage configuration for products
const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/products/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Storage configuration for categories
const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/categories/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const productUpload = multer({
    storage: productStorage,
    limits: { fileSize: 1000000 }, // 1MB file size limit
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

const categoryUpload = multer({
    storage: categoryStorage,
    limits: { fileSize: 1000000 }, // 1MB file size limit
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

module.exports = { productUpload, categoryUpload };
