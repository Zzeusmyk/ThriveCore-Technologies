const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect .html URLs to clean URLs
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const clean = req.path.slice(0, -5);
    return res.redirect(301, clean || '/');
  }
  next();
});

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname), { extensions: false }));

// ===== DATABASE SETUP =====
const db = new Database(path.join(__dirname, 'data', 'submissions.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create submissions table
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    service TEXT,
    message TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  )
`);

// ===== API ENDPOINTS =====

// POST - Receive contact form submission
app.post('/api/contact', (req, res) => {
  const { firstName, lastName, email, phone, company, service, message } = req.body;

  // Validation
  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields.'
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.'
    });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO submissions (first_name, last_name, email, phone, company, service, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      firstName.trim(),
      lastName.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim() : null,
      company ? company.trim() : null,
      service || null,
      message.trim()
    );

    res.json({
      success: true,
      message: 'Thank you! Your message has been received. We\'ll get back to you within 24 hours.',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
});

// GET - Retrieve all submissions (admin)
app.get('/api/submissions', (req, res) => {
  try {
    const submissions = db.prepare(
      'SELECT * FROM submissions ORDER BY submitted_at DESC'
    ).all();

    res.json({ success: true, data: submissions, count: submissions.length });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve submissions.' });
  }
});

// GET - Single submission
app.get('/api/submissions/:id', (req, res) => {
  try {
    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    // Mark as read
    db.prepare('UPDATE submissions SET is_read = 1 WHERE id = ?').run(req.params.id);

    res.json({ success: true, data: submission });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve submission.' });
  }
});

// DELETE - Remove a submission
app.delete('/api/submissions/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM submissions WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    res.json({ success: true, message: 'Submission deleted.' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete submission.' });
  }
});

// GET - Stats
app.get('/api/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
    const unread = db.prepare('SELECT COUNT(*) as count FROM submissions WHERE is_read = 0').get().count;
    const today = db.prepare(
      "SELECT COUNT(*) as count FROM submissions WHERE date(submitted_at) = date('now')"
    ).get().count;

    res.json({ success: true, total, unread, today });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stats.' });
  }
});

// Serve pages with clean URLs (no .html extension)
const pages = ['about', 'services', 'products', 'contact', 'admin'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, `${page}.html`));
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
  ========================================
   ThriveCore Technologies Server
  ========================================
   Website:  http://localhost:${PORT}
   Admin:    http://localhost:${PORT}/admin
   API:      http://localhost:${PORT}/api/submissions
  ========================================
  `);
});
