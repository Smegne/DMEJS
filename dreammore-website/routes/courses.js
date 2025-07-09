const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseControllers');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Fetch all courses for front page
router.get('/', courseController.getCourses);

// Dashboard to view all courses (admin)
router.get('/dashboard', courseController.getDashboard);

// Route to handle course application POST (upload screenshot)
router.post('/apply', upload.single('screenshot'), courseController.applyCourse);

// Handle adding a new course (upload course photo)
router.post('/add', upload.single('photo'), courseController.addCourse);

// Handle deleting a course
router.post('/delete/:id', courseController.deleteCourse);

module.exports = router;