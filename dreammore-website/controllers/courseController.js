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


const pool = require('../config/db'); // import the pool

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

        // Redirect to thank-you page after successful submission
        res.redirect('/thank-you');
    } catch (err) {
        console.error('❌ DB Error:', err);
        res.status(500).send('Something went wrong. Please try again later.');
    }
};


// Show dashboard with all courses
exports.getDashboard = async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.render('courses/dashboard', { courses });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).send('Failed to load courses');
  }
};

// Add a new course
exports.addCourse = async (req, res) => {
  const { title, key, description } = req.body;
  const photo = req.file ? req.file.filename : null;

  if (!title || !key) {
    return res.status(400).send('Title and Key are required');
  }

  try {
    await pool.query(
      'INSERT INTO courses (name, title, description, photo) VALUES (?, ?, ?, ?)',
      [key, title, description || '', photo]
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
    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    console.log('✅ Course deleted with ID:', id);
    res.redirect('/courses/dashboard');
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).send('Failed to delete course');
  }
};
