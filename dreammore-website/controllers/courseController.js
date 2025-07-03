const db = require('../config/db');
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

// Get all courses
exports.getCourses = (req, res) => {
    db.query('SELECT * FROM courses', (err, courses) => {
        if (err) throw err;
        res.render('courses', { user: req.session.user, courses });
    });
};

// Show application form for selected course
exports.applyCourse = (req, res) => {
    const { courseKey } = req.body;

    if (!courseKey) {
        return res.status(400).send("Course key is missing.");
    }

    db.query('SELECT * FROM courses WHERE course_key = ?', [courseKey], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(404).send("Course not found.");
        }

        const course = results[0];
        res.render('courses/apply', { user: req.session.user, course });
    });
};

// Handle payment form submission
exports.submitPayment = [
    upload.single('screenshot'), // 'screenshot' must match input name in HTML
    (req, res) => {
        const { user_id, courseKey, payment_method } = req.body;
        const payment_screenshot = req.file ? req.file.filename : null;

        if (!user_id || !courseKey || !payment_method || !payment_screenshot) {
            return res.status(400).send("Missing required fields.");
        }

        // First get course_id from courseKey
        db.query('SELECT id FROM courses WHERE course_key = ?', [courseKey], (err, result) => {
            if (err) throw err;

            const course_id = result[0]?.id;
            if (!course_id) {
                return res.status(400).send('Invalid course selected.');
            }

            // Insert payment record
            db.query(
                'INSERT INTO payments (user_id, course_id, payment_method, payment_screenshot, payment_status) VALUES (?, ?, ?, ?, ?)',
                [user_id, course_id, payment_method, payment_screenshot, 'pending'],
                (err) => {
                    if (err) throw err;

                    res.render('courses/payment_confirmation', {
                        message: 'Payment submitted successfully. Please keep your payment proof. If you don’t get a reply in 24 hours, contact Dreammore.'
                    });
                }
            );
        });
    }
];
