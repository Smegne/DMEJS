const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.addUser);
router.get('/payments', adminController.getPayments);
router.post('/verify-payment', adminController.verifyPayment);
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.addCourse);

module.exports = router;