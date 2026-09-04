const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB Connection (Yeh automatically .env ya Vercel Environment Variables se URI uthaye ga)
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Admin Schema & Model
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Admin' }
});
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// Root Route
app.get('/', (req, res) => {
  res.send('Amazon Leftover Backend is running successfully!');
});

// Settings API Route (Fixes Theme/404 Error)
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    settings: {
      siteName: "Amazon Leftover",
      theme: "light",
      currency: "PKR"
    }
  });
});

// Admin Login API Route
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log("Incoming Login Body:", req.body);

    const { email, username, password } = req.body;
    const loginIdentifier = email || username;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required!" });
    }

    const admin = await Admin.findOne({ 
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }] 
    });
    
    if (!admin) {
      return res.status(400).json({ success: false, message: "Admin not found in database!" });
    }

    let isMatch = false;
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      isMatch = (password === admin.password);
    }
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password!" });
    }

    res.json({ 
      success: true, 
      message: "Login successful!", 
      admin: { email: admin.email, name: admin.name } 
    });
  } catch (err) {
    console.error("Login Detailed Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vercel ke liye export
module.exports = app;