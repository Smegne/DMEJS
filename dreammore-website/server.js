const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const workerRoutes = require('./routes/worker');

dotenv.config();
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Routes
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/worker', workerRoutes);

// Dummy courses array
const dummyCourses = [
    { title: "Web Development Bootcamp", photo: "web_dev.jpg" },
    { title: "Graphic Design Mastery", photo: "graphic_design.jpg" },
    { title: "Video Editing Pro", photo: "video_editing.jpg" }
];

// Main routes
app.get('/', (req, res) => {
    res.render('home', {
        user: req.session.user || null,
        courses: dummyCourses // 👈 Pass courses here
    });
});
app.get('/services', (req, res) => {
    res.render('services', { user: req.session.user });
});
app.get('/portfolio', (req, res) => {
    res.render('portfolio', { user: req.session.user });
});
app.get('/about', (req, res) => {
    res.render('about', { user: req.session.user });
});
app.get('/teams', (req, res) => {
    res.render('teams', { user: req.session.user });
});
app.get('/testimonials', (req, res) => {
    res.render('testimonials', { user: req.session.user });
});
app.get('/contact', (req, res) => {
    res.render('contact', { user: req.session.user });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
