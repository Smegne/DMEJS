const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getCourses);
router.post('/apply', courseController.applyCourse);
router.post('/submit-payment', courseController.submitPayment);

module.exports = router;