const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB Direct Connection with 'ecommerce' database name
const MONGO_URI = "mongodb+srv://aslamabdullah288_db_user:Abd12345@abdullah.2zmjnx6.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Abdullah";

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

app.get('/', (req, res) => {
  res.send('Amazon Leftover Backend is running successfully on Vercel!');
});

// Admin Login API Route with detailed error catching
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

    // Supports both plain text or hashed passwords safely
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