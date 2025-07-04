const express = require('express');
const router = express.Router(); // ✅ Declare router only ONCE

const adminController = require('../controllers/adminController');
const db = require('../config/db');

// AdminController routes
router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.addUser);
router.get('/payments', adminController.getPayments);
router.post('/verify-payment', adminController.verifyPayment);
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.addCourse);

// Admin dashboard route with filter
router.get('/dashboard', (req, res) => {
    const filter = req.query.status || 'all';

    let sql = `
        SELECT o.id, o.service_detail, o.created_at, o.status,
               u.first_name, u.last_name, u.email, u.phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
    `;

    if (filter === 'pending') {
        sql += " WHERE o.status = 'pending'";
    } else if (filter === 'completed') {
        sql += " WHERE o.status = 'completed'";
    }

    sql += " ORDER BY o.created_at DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Failed to fetch orders:', err);
            return res.status(500).send('Error loading dashboard.');
        }
        res.render('admin-dashboard', { orders: results, filter });
    });
});

// Mark order as completed
router.post('/orders/:id/complete', (req, res) => {
    const orderId = req.params.id;
    const sql = `UPDATE orders SET status = 'completed' WHERE id = ?`;

    db.query(sql, [orderId], (err, result) => {
        if (err) {
            console.error('❌ Failed to update order status:', err);
            return res.status(500).send('Failed to update order.');
        }
        res.redirect('/admin/dashboard');
    });
});



const isAdmin = require('../middleware/isAdmin');

// Admin dashboard (protected)
router.get('/dashboard', isAdmin, (req, res) => {
    const filter = req.query.status || 'all';

    let sql = `
        SELECT o.id, o.service_detail, o.created_at, o.status,
               u.first_name, u.last_name, u.email, u.phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
    `;

    if (filter === 'pending') {
        sql += " WHERE o.status = 'pending'";
    } else if (filter === 'completed') {
        sql += " WHERE o.status = 'completed'";
    }

    sql += " ORDER BY o.created_at DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Failed to fetch orders:', err);
            return res.status(500).send('Error loading dashboard.');
        }
        res.render('admin-dashboard', { orders: results, filter });
    });
});

// Mark order as completed
router.post('/orders/:id/complete', isAdmin, (req, res) => {
    const orderId = req.params.id;
    const sql = `UPDATE orders SET status = 'completed' WHERE id = ?`;

    db.query(sql, [orderId], (err, result) => {
        if (err) {
            console.error('❌ Failed to update order status:', err);
            return res.status(500).send('Failed to update order.');
        }
        res.redirect('/admin/dashboard');
    });
});

// Delete order
router.post('/orders/:id/delete', isAdmin, (req, res) => {
    const orderId = req.params.id;
    const sql = `DELETE FROM orders WHERE id = ?`;

    db.query(sql, [orderId], (err, result) => {
        if (err) {
            console.error('❌ Failed to delete order:', err);
            return res.status(500).send('Failed to delete order.');
        }
        res.redirect('/admin/dashboard');
    });
});



// Export router
module.exports = router;
