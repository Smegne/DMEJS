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
const testimonialRoutes = require('./routes/testimonial');

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
app.use('/', testimonialRoutes);

// Home route fetching testimonials and courses
app.get('/', async (req, res) => {
    try {
        const [testimonials] = await db.query("SELECT * FROM testimonials");
        const [courses] = await db.query("SELECT * FROM courseslist");
        res.render('home', { 
            courses: courses || [], 
            testimonials: testimonials || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.render('home', { 
            courses: [], 
            testimonials: [], 
            error: 'Failed to load courses or testimonials' 
        });
    }
});

// Other static routes
app.get('/services', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        res.render('services', { courses: courses || [] });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('services', { courses: [], error: 'Failed to load courses' });
    }
});
app.get('/portfolio', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        res.render('portfolio', { courses: courses || [] });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('portfolio', { courses: [], error: 'Failed to load courses' });
    }
});
app.get('/about', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        res.render('about', { courses: courses || [] });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('about', { courses: [], error: 'Failed to load courses' });
    }
});
app.get('/teams', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        res.render('teams', { courses: courses || [] });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('teams', { courses: [], error: 'Failed to load courses' });
    }
});

// Testimonials page route
app.get('/testimonials', async (req, res) => {
    try {
        const [testimonials] = await db.query("SELECT * FROM testimonials");
        const [courses] = await db.query("SELECT * FROM courseslist");
        res.render('testimonials', { 
            testimonials: testimonials || [], 
            courses: courses || [], 
            error: null 
        });
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.render('testimonials', { 
            testimonials: [], 
            courses: [], 
            error: 'Failed to load testimonials' 
        });
    }
});

app.get('/contact', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        res.render('contact', { courses: courses || [] });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('contact', { courses: [], error: 'Failed to load courses' });
    }
});

app.get('/thank-you', async (req, res) => {
    try {
        const [courses] = await db.query("SELECT * FROM courseslist");
        res.render('thank-you', { courses: courses || [] });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.render('thank-you', { courses: [], error: 'Failed to load courses' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});