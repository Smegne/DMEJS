const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.signup = async (req, res) => {
    const { first_name, last_name, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
        'INSERT INTO users (first_name, last_name, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        [first_name, last_name, phone, email, hashedPassword, 'student'],
        (err) => {
            if (err) {
                return res.render('auth/signup', { error: 'Email already exists' });
            }
            res.redirect('/auth/signin');
        }
    );
};

exports.signin = (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.render('auth/signin', { error: 'Invalid credentials' });
        }
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/signin', { error: 'Invalid credentials' });
        }
        req.session.user = user;
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else if (user.role === 'worker') {
            res.redirect('/worker/dashboard');
        } else {
            res.redirect('/');
        }
    });
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};