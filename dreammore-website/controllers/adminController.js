const db = require('../config/db');
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
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

exports.getDashboard = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    db.query('SELECT COUNT(*) as total_users FROM users', (err, users) => {
        if (err) {
            console.error('Error fetching users:', err.stack);
            return res.render('admin/dashboard', { user: req.session.user, error: 'Database error' });
        }
        db.query('SELECT COUNT(*) as total_students FROM users WHERE role = "student"', (err, students) => {
            if (err) {
                console.error('Error fetching students:', err.stack);
                return res.render('admin/dashboard', { user: req.session.user, error: 'Database error' });
            }
            db.query('SELECT COUNT(*) as total_workers FROM users WHERE role = "worker"', (err, workers) => {
                if (err) {
                    console.error('Error fetching workers:', err.stack);
                    return res.render('admin/dashboard', { user: req.session.user, error: 'Database error' });
                }
                db.query('SELECT COUNT(*) as total_courses FROM courses', (err, courses) => {
                    if (err) {
                        console.error('Error fetching courses:', err.stack);
                        return res.render('admin/dashboard', { user: req.session.user, error: 'Database error' });
                    }
                    res.render('admin/dashboard', {
                        user: req.session.user,
                        total_users: users[0].total_users,
                        total_students: students[0].total_students,
                        total_workers: workers[0].total_workers,
                        total_courses: courses[0].total_courses
                    });
                });
            });
        });
    });
};

exports.getUsers = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    db.query('SELECT id, first_name, last_name, email, phone, role FROM users', (err, users) => {
        if (err) {
            console.error('Error fetching users:', err.stack);
            return res.render('admin/users', { user: req.session.user, users: [], error: 'Database error' });
        }
        res.render('admin/users', { user: req.session.user, users });
    });
};

exports.addUser = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    const { first_name, last_name, phone, email, password, role } = req.body;
    if (!['admin', 'worker', 'student'].includes(role)) {
        return res.redirect('/admin/users?error=Invalid role');
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (first_name, last_name, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, phone, email, hashedPassword, role],
            (err) => {
                if (err) {
                    console.error('Error adding user:', err.stack);
                    return res.redirect('/admin/users?error=Email already exists');
                }
                res.redirect('/admin/users?message=User added successfully');
            }
        );
    } catch (error) {
        console.error('Error hashing password:', error.stack);
        res.redirect('/admin/users?error=Failed to add user');
    }
};

exports.getPayments = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    db.query(`
        SELECT p.id, p.user_id, u.first_name, u.last_name, p.course_id, c.title as course_title, p.payment_method, p.payment_screenshot, p.payment_status
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN courses c ON p.course_id = c.id
    `, (err, payments) => {
        if (err) {
            console.error('Error fetching payments:', err.stack);
            return res.render('admin/payments', { user: req.session.user, payments: [], error: 'Database error' });
        }
        res.render('admin/payments', { user: req.session.user, payments });
    });
};

exports.verifyPayment = (req, res) => {
    const { payment_id, course_id, user_id } = req.body;
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    db.query('UPDATE payments SET payment_status = "verified" WHERE id = ?', [payment_id], (err) => {
        if (err) {
            console.error('Error verifying payment:', err.stack);
            return res.redirect('/admin/payments?error=Verification failed');
        }
        db.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [user_id, course_id], (err) => {
            if (err) {
                console.error('Error enrolling user:', err.stack);
                return res.redirect('/admin/payments?error=Enrollment failed');
            }
            // Update session enrolledCourses
            db.query('SELECT key FROM courses WHERE id = ?', [course_id], (err, course) => {
                if (!err && course.length) {
                    req.session.user.enrolledCourses = req.session.user.enrolledCourses || [];
                    if (!req.session.user.enrolledCourses.includes(course[0].key)) {
                        req.session.user.enrolledCourses.push(course[0].key);
                    }
                }
                res.redirect('/admin/payments?message=Payment verified and user enrolled');
            });
        });
    });
};

exports.getCourses = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    db.query('SELECT * FROM courses', (err, courses) => {
        if (err) {
            console.error('Error fetching courses:', err.stack);
            return res.render('admin/courses', { user: req.session.user, courses: [], error: 'Database error' });
        }
        res.render('admin/courses', { user: req.session.user, courses });
    });
};

exports.addCourse = [upload.single('photo'), (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/?error=Unauthorized');
    }
    const { name, key, title, description } = req.body;
    const photo = req.file ? req.file.filename : null;
    if (!name || !key || !title) {
        return res.redirect('/admin/courses?error=Name, key, and title are required');
    }
    db.query(
        'INSERT INTO courses (name, key, title, description, photo) VALUES (?, ?, ?, ?, ?)',
        [name, key, title, description, photo],
        (err) => {
            if (err) {
                console.error('Error adding course:', err.stack);
                return res.redirect('/admin/courses?error=Course key must be unique');
            }
            res.redirect('/admin/courses?message=Course added successfully');
        }
    );
}];

module.exports = exports;