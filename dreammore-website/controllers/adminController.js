const db = require('../config/db'); // make sure db is mysql2/promise
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configure multer for course photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/Uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG/PNG images are allowed for course photos'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// 🔒 Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    next();
}

// ✅ Get Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const [users] = await db.query('SELECT COUNT(*) as total_users FROM users');
        const [students] = await db.query('SELECT COUNT(*) as total_students FROM users WHERE role = "student"');
        const [workers] = await db.query('SELECT COUNT(*) as total_workers FROM users WHERE role = "worker"');
        const [courses] = await db.query('SELECT COUNT(*) as total_courses FROM courses');
        const [orders] = await db.query(`
            SELECT o.id, o.service_detail, o.created_at, 
                   u.first_name, u.last_name, u.email, u.phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);

        res.render('admin/dashboard', {
            user: req.session.user,
            total_users: users[0].total_users,
            total_students: students[0].total_students,
            total_workers: workers[0].total_workers,
            total_courses: courses[0].total_courses,
            orders
        });
    } catch (err) {
        console.error('❌ Error loading dashboard:', err);
        res.status(500).send('Error loading dashboard.');
    }
};

// ✅ Get Users
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, first_name, last_name, email, phone, role FROM users');
        res.render('admin/users', { user: req.session.user, users });
    } catch (err) {
        console.error('❌ Error fetching users:', err);
        res.status(500).send('Error loading users.');
    }
};

// ✅ Add User
exports.addUser = async (req, res) => {
    const { first_name, last_name, phone, email, password, role } = req.body;
    if (!['admin', 'worker', 'student'].includes(role)) {
        return res.redirect('/admin/users?error=Invalid role');
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (first_name, last_name, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, phone, email, hashedPassword, role]
        );
        res.redirect('/admin/users?message=User added successfully');
    } catch (err) {
        console.error('❌ Error adding user:', err);
        res.redirect('/admin/users?error=Failed to add user');
    }
};

// ✅ Get Payments
exports.getPayments = async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT p.id, p.user_id, u.first_name, u.last_name, p.course_id, 
                   c.title as course_title, p.payment_method, p.payment_screenshot, p.payment_status
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN courses c ON p.course_id = c.id
        `);
        res.render('admin/payments', { user: req.session.user, payments });
    } catch (err) {
        console.error('❌ Error fetching payments:', err);
        res.status(500).send('Error loading payments.');
    }
};

// ✅ Verify Payment
exports.verifyPayment = async (req, res) => {
    const { payment_id, course_id, user_id } = req.body;
    try {
        await db.query('UPDATE payments SET payment_status = "verified" WHERE id = ?', [payment_id]);
        await db.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [user_id, course_id]);
        res.redirect('/admin/payments?message=Payment verified and user enrolled');
    } catch (err) {
        console.error('❌ Error verifying payment:', err);
        res.redirect('/admin/payments?error=Verification failed');
    }
};

// ✅ Get Courses
exports.getCourses = async (req, res) => {
    try {
        const [courses] = await db.query('SELECT * FROM courses');
        res.render('admin/courses', { user: req.session.user, courses });
    } catch (err) {
        console.error('❌ Error fetching courses:', err);
        res.status(500).send('Error loading courses.');
    }
};

// ✅ Add Course
exports.addCourse = [
    upload.single('photo'),
    async (req, res) => {
        const { name, key, title, description } = req.body;
        const photo = req.file ? req.file.filename : null;
        if (!name || !key || !title) {
            return res.redirect('/admin/courses?error=Name, key, and title are required');
        }
        try {
            await db.query(
                'INSERT INTO courses (name, key, title, description, photo) VALUES (?, ?, ?, ?, ?)',
                [name, key, title, description, photo]
            );
            res.redirect('/admin/courses?message=Course added successfully');
        } catch (err) {
            console.error('❌ Error adding course:', err);
            res.redirect('/admin/courses?error=Failed to add course');
        }
    }
];

module.exports = exports;
