const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

// Routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const workerRoutes = require('./routes/worker');
const testimonialRoutes = require('./routes/testimonial'); // Added testimonial routes

// Database connection (promise-based)
const db = require('./config/db');

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

// Middleware to make `user` available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Use routes
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/worker', workerRoutes);
app.use('/', testimonialRoutes); // Mount testimonial routes here

// Dummy courses array
const dummyCourses = [
    { title: "Web Development Bootcamp", photo: "web_dev.jpg" },
    { title: "Graphic Design Mastery", photo: "graphic_design.jpg" },
    { title: "Video Editing Pro", photo: "video_editing.jpg" }
];

// Home route fetching testimonials and courses
app.get('/', async (req, res) => {
    try {
        const [testimonials] = await db.query("SELECT * FROM testimonials");
        res.render('home', {
            courses: dummyCourses,
            testimonials
        });
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.status(500).send('Server Error');
    }
});

// Other static routes
app.get('/services', (req, res) => {
    res.render('services');
});
app.get('/portfolio', (req, res) => {
    res.render('portfolio');
});
app.get('/about', (req, res) => {
    res.render('about');
});
app.get('/teams', (req, res) => {
    res.render('teams');
});

// Testimonials page route
app.get('/testimonials', async (req, res) => {
    try {
        const [testimonials] = await db.query("SELECT * FROM testimonials");
        res.render('testimonials', {
            testimonials
        });
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.status(500).send('Server Error');
    }
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/thank-you', (req, res) => {
    res.render('thank-you');
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
