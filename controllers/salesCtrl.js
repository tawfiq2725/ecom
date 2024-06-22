const Order = require('../models/orderSchema');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const getSalesReportPage = async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    res.render('admin/salesreport', { layout: 'adminlayout', title: "Sales Report" });
};

const generateSalesReport = async (req, res) => {
    try {
        const { type, fromDate, toDate } = req.query;

        let filter = {};
        const today = moment();
        if (type && type !== 'custom') {
            if (type === 'daily') {
                filter.createdAt = { $gte: today.startOf('day').toDate(), $lte: today.endOf('day').toDate() };
            } else if (type === 'weekly') {
                filter.createdAt = { $gte: today.startOf('week').toDate(), $lte: today.endOf('week').toDate() };
            } else if (type === 'monthly') {
                filter.createdAt = { $gte: today.startOf('month').toDate(), $lte: today.endOf('month').toDate() };
            } else if (type === 'yearly') {
                filter.createdAt = { $gte: today.startOf('year').toDate(), $lte: today.endOf('year').toDate() };
            }
        } else if (fromDate && toDate) {
            filter.createdAt = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        }

        const orders = await Order.find(filter)
            .populate('user', 'firstname lastname')
            .populate('address')
            .lean();

        const reportDetails = calculateReportDetails(orders);

        res.json({ orders, reportDetails });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const calculateReportDetails = (orders) => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + order.discountAmount + (order.coupon ? order.coupon.discountAmount : 0), 0);

    return { totalOrders, totalAmount, totalDiscount };
};

const downloadSalesReport = async (req, res) => {
    const { type, fromDate, toDate, format } = req.body;
    const filter = { ...req.query }; // Same filter logic as generateSalesReport

    const orders = await Order.find(filter)
        .populate('user', 'firstname lastname')
        .populate('address')
        .lean();

    if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Order ID', key: '_id', width: 30 },
            { header: 'Order Date', key: 'createdAt', width: 30 },
            { header: 'User', key: 'user', width: 30 },
            { header: 'Products', key: 'items', width: 50 },
            { header: 'Shipping Address', key: 'address', width: 50 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Status', key: 'orderStatus', width: 20 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Coupon', key: 'coupon', width: 20 },
            { header: 'Coupon Discount', key: 'couponDiscount', width: 20 },
            { header: 'Payable', key: 'payable', width: 20 },
            { header: 'Category Discount', key: 'discountAmount', width: 20 },
        ];

        orders.forEach(order => {
            worksheet.addRow({
                _id: order._id,
                createdAt: moment(order.createdAt).format('YYYY-MM-DD '),
                user: `${order.user.firstname} ${order.user.lastname}`,
                items: order.items.map(item => `${item.product.name} - ${item.quantity} x ${item.size} - ₹${item.price}`).join('\n'),
                address: `${order.address.houseNumber}, ${order.address.street}, ${order.address.city}, ${order.address.zipcode}, ${order.address.country}`,
                paymentMethod: order.paymentMethod,
                orderStatus: order.orderStatus,
                totalAmount: order.totalAmount,
                coupon: order.coupon ? order.coupon.code : '',
                couponDiscount: order.coupon ? order.coupon.discountAmount : 0,
                payable: order.totalAmount - (order.coupon ? order.coupon.discountAmount : 0),
                discountAmount: order.discountAmount
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } else if (format === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.pdf');

        doc.pipe(res);

        doc.fontSize(25).text('Sales Report', { align: 'center' });

        orders.forEach(order => {
            doc.fontSize(12).text(`Order ID: ${order._id}`, { continued: true }).text(`Order Date: ${moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}`);
            doc.fontSize(12).text(`User: ${order.user.firstname} ${order.user.lastname}`);
            doc.fontSize(12).text(`Products: ${order.items.map(item => `${item.product.name} - ${item.quantity} x ${item.size} - ₹${item.price}`).join(', ')}`);
            doc.fontSize(12).text(`Shipping Address: ${order.address.houseNumber}, ${order.address.street}, ${order.address.city}, ${order.address.zipcode}, ${order.address.country}`);
            doc.fontSize(12).text(`Payment Method: ${order.paymentMethod}`);
            doc.fontSize(12).text(`Status: ${order.orderStatus}`);
            doc.fontSize(12).text(`Total Amount: ₹${order.totalAmount}`);
            doc.fontSize(12).text(`Coupon: ${order.coupon ? order.coupon.code : ''}`);
            doc.fontSize(12).text(`Coupon Discount: ₹${order.coupon ? order.coupon.discountAmount : 0}`);
            doc.fontSize(12).text(`Payable: ₹${order.totalAmount - (order.coupon ? order.coupon.discountAmount : 0)}`);
            doc.fontSize(12).text(`Category Discount: ₹${order.discountAmount}`);
            doc.moveDown();
        });

        doc.end();
    } else {
        res.status(400).send('Invalid format');
    }
};

module.exports = {
    getSalesReportPage,
    generateSalesReport,
    downloadSalesReport
};