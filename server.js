const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB Direct Connection
mongoose.connect("mongodb+srv://aslamabdullah288_db_user:Abd12345@abdullah.2zmjnx6.mongodb.net/?retryWrites=true&w=majority&appName=Abdullah")
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

// Admin Login API Route (Supports both email or username)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginIdentifier = email || username;

    const admin = await Admin.findOne({ 
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }] 
    });
    
    if (!admin) {
      return res.status(400).json({ success: false, message: "Admin not found in database!" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password!" });
    }

    res.json({ success: true, message: "Login successful!", admin: { email: admin.email, name: admin.name } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vercel ke liye app.listen nahi likhte, balkay app ko export karte hain:
module.exports = app;