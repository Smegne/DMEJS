const db = require('../config/db');

// Fetch testimonials from DB
exports.getTestimonials = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM testimonials");
    res.render("home", { testimonials: results });
  } catch (err) {
    console.error('❌ Error fetching testimonials:', err);
    res.status(500).send("Server Error");
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
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

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
