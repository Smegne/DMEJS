const express = require('express');
const router = express.Router();
const multer = require('multer');
const testimonialController = require('../controllers/testimonialController');

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Save uploaded photos here
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});
const upload = multer({ storage });

// Route: Home page (list testimonials)
router.get('/', testimonialController.getTestimonials);

// Route: Show admin form to add testimonial
router.get('/admin/add-testimonial', testimonialController.showAddForm);

// Route: Handle testimonial form submission
router.post('/admin/add-testimonial', upload.single('photo'), testimonialController.addTestimonial);

module.exports = router;
