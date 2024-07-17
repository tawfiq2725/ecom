const Order = require('../models/orderSchema');
const moment = require('moment');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer-core');
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

        let filter = { orderStatus: 'Delivered' };
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
            .populate({
                path: 'items.product',
                select: 'name'
            })
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

const generateHTMLContent = (orders, reportDetails, fromDate, toDate) => {
    const styles = `
        <style>
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid #dddddd;
                text-align: left;
                padding: 8px;
            }
            th {
                background-color: #f2f2f2;
            }
        </style>
    `;

    const formattedFromDate = fromDate ? moment(fromDate).format('YYYY-MM-DD') : 'N/A';
    const formattedToDate = toDate ? moment(toDate).format('YYYY-MM-DD') : 'N/A';

    const header = `
        <h1>HOSSOM SHIRTS</h1>
        <p>From Date: ${formattedFromDate}</p>
        <p>To Date: ${formattedToDate}</p>
        <h2>Sales Report</h2>
        <p>Total Orders: ${reportDetails.totalOrders}</p>
        <p>Total Amount: ₹${reportDetails.totalAmount}</p>
        <p>Total Discount: ₹${reportDetails.totalDiscount}</p>
    `;

    const tableHeaders = `
        <tr>
            <th>Order ID</th>
            <th>Order Date</th>
            <th>User</th>
            <th>Products</th>
            <th>Shipping Address</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Total Amount</th>
            <th>Coupon</th>
            <th>Coupon Discount</th>
            <th>Payable</th>
            <th>Category Discount</th>
        </tr>
    `;

    const tableRows = orders.map(order => `
        <tr>
            <td>${order._id}</td>
            <td>${moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}</td>
            <td>${order.user.firstname} ${order.user.lastname}</td>
            <td>${order.items.map(item => `${item.product.name} - ${item.quantity} x ${item.size} - ₹${item.price}`).join(', ')}</td>
            <td>${order.address.houseNumber}, ${order.address.street}, ${order.address.city}, ${order.address.zipcode}, ${order.address.country}</td>
            <td>${order.paymentMethod}</td>
            <td>${order.orderStatus}</td>
            <td>₹${order.totalAmount}</td>
            <td>${order.coupon ? order.coupon.code : ''}</td>
            <td>₹${order.coupon ? order.coupon.discountAmount : 0}</td>
            <td>₹${order.totalAmount - (order.coupon ? order.coupon.discountAmount : 0)}</td>
            <td>₹${order.discountAmount}</td>
        </tr>
    `).join('');

    const table = `<table>${tableHeaders}${tableRows}</table>`;

    return `<html><head>${styles}</head><body>${header}${table}</body></html>`;
};


const downloadSalesReport = async (req, res) => {
    const { type, fromDate, toDate, format } = req.body;

    let filter = { orderStatus: 'Delivered' };

    if (type && type !== 'custom') {
        const today = moment();
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
        .populate({
            path: 'items.product',
            select: 'name'
        })
        .populate('address')
        .lean();

    const reportDetails = calculateReportDetails(orders);

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
        const htmlContent = generateHTMLContent(orders, reportDetails, fromDate, toDate);

        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'  // Update this path as needed
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A3', printBackground: true });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.pdf');
        res.send(pdfBuffer);
    } else {
        res.status(400).send('Invalid format');
    }
};



module.exports = {
    getSalesReportPage,
    generateSalesReport,
    downloadSalesReport
};
