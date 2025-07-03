const db = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

exports.getDashboard = (req, res) => {
    if (req.session.user?.role !== 'worker') {
        return res.redirect('/');
    }
    res.render('worker/dashboard', { user: req.session.user });
};

exports.uploadMaterial = [upload.single('file'), (req, res) => {
    const { course_id, title, description } = req.body;
    const file_path = req.file ? req.file.filename : null;
    db.query(
        'INSERT INTO course_materials (course_id, worker_id, title, description, file_path) VALUES (?, ?, ?, ?, ?)',
        [course_id, req.session.user.id, title, description, file_path],
        (err) => {
            if (err) throw err;
            res.redirect('/worker/dashboard');
        }
    );
}];