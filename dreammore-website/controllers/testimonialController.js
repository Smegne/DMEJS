const db = require('../config/db');

// Fetch testimonials from DB
exports.getTestimonials = async (req, res) => {
  try {
    const [testimonials] = await db.query("SELECT * FROM testimonials");
    const [courses] = await db.query("SELECT * FROM courseslist");
    res.render("home", { 
      testimonials: testimonials || [], 
      courses: courses || [], 
      error: null 
    });
  } catch (err) {
    console.error('❌ Error fetching testimonials:', err);
    res.render("home", { 
      testimonials: [], 
      courses: [], 
      error: 'Failed to load testimonials or courses' 
    });
  }
};

// Show Add Testimonial Form
exports.showAddForm = (req, res) => {
  res.render('admin/add-testimonial', {
    user: req.session.user // For admin session, adjust as needed
  });
};

// Handle Add Testimonial POST
exports.addTestimonial = async (req, res) => {
  const { name, description } = req.body;
  const photo = req.file ? `/Uploads/${req.file.filename}` : null;

  try {
    await db.query(
      "INSERT INTO testimonials (name, description, photo) VALUES (?, ?, ?)",
      [name, description, photo]
    );
    console.log("✅ Testimonial added successfully");
    res.redirect('/testimonials'); // Redirect to testimonials page
  } catch (err) {
    console.error("❌ Error adding testimonial:", err);
    res.status(500).send("Server Error");
  }
};