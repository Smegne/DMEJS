const pool = require('../config/db');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + file.originalname;
        cb(null, uniqueSuffix);
    }
});
const upload = multer({ storage });

// Get all courses for front page
exports.getCourses = async (req, res) => {
    try {
        const [courses] = await pool.query('SELECT * FROM courseslist');
        res.render('courses', { user: req.session.user, courses: courses || [] });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('courses', { user: req.session.user, courses: [], error: 'Failed to load courses' });
    }
};

// Handle course application
exports.applyCourse = async (req, res) => {
    console.log('DEBUG req.body:', req.body);
    console.log('DEBUG req.file:', req.file);

    const { courseKey, userId } = req.body;
    const screenshot = req.file ? req.file.filename : null;

    if (!courseKey || !userId || !screenshot) {
        console.error('Missing courseKey, userId, or screenshot');
        return res.status(400).send('Missing data: courseKey, userId, or payment screenshot.');
    }

    try {
        const sql = `
            INSERT INTO course_applications (user_id, course_key, screenshot)
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.execute(sql, [userId, courseKey, screenshot]);
        console.log('✅ Application saved. Insert ID:', result.insertId);
        res.redirect('/thank-you');
    } catch (err) {
        console.error('❌ DB Error:', err);
        res.status(500).send('Something went wrong. Please try again later.');
    }
};

// Show dashboard with all courses (admin)
exports.getDashboard = async (req, res) => {
    try {
        const [courses] = await pool.query('SELECT * FROM courseslist ORDER BY id DESC');
        res.render('admin/courses', { courses: courses || [] });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('admin/courses', { courses: [], error: 'Failed to load courses' });
    }
};

// Add a new course
exports.addCourse = async (req, res) => {
    const { title, description } = req.body;
    const photo = req.file ? req.file.filename : null;

    if (!title) {
        return res.status(400).send('Title is required');
    }

    try {
        await pool.query(
            'INSERT INTO courseslist (title, description, photo) VALUES (?, ?, ?)',
            [title, description || '', photo]
        );
        console.log('✅ New course added:', title);
        res.redirect('/courses/dashboard');
    } catch (err) {
        console.error('Error adding course:', err);
        res.status(500).send('Failed to add course');
    }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM courseslist WHERE id = ?', [id]);
        console.log('✅ Course deleted with ID:', id);
        res.redirect('/courses/dashboard');
    } catch (err) {
        console.error('Error deleting course:', err);
        res.status(500).send('Failed to delete course');
    }
};