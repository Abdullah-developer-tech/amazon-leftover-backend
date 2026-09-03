const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin'); // Admin model import kiya hai
const { protectCustomer } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

function makeToken(customer) {
  return jwt.sign(
    { id: customer._id, email: customer.email, name: customer.name, type: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/customers/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      phone: phone || '',
      address: address || '',
    });

    const token = makeToken(customer);
    res.status(201).json({
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, address: customer.address },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/customers/login (Unified Login for Admin & Customer)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase();

    // 1. Pehle check karein ke kya yeh Admin ki email hai?
    const admin = await Admin.findOne({ email: cleanEmail });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        const token = jwt.sign(
          { id: admin._id, email: admin.email, name: admin.name, type: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({
          token,
          isAdmin: true, // Frontend ko batane ke liye ke yeh admin hai
          admin: { id: admin._id, email: admin.email, name: admin.name }
        });
      }
    }

    // 2. Agar admin nahi hai, toh Customer login check karein
    const customer = await Customer.findOne({ email: cleanEmail });
    if (!customer) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, customer.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    const token = makeToken(customer);
    res.json({
      token,
      isAdmin: false, // Customer ke liye false
      customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, address: customer.address },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customers/me - current logged-in customer profile
router.get('/me', protectCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password');
    if (!customer) return res.status(404).json({ message: 'Account not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/customers/me - update profile (name/phone/address)
router.put('/me', protectCustomer, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const customer = await Customer.findById(req.customer.id);
    if (!customer) return res.status(404).json({ message: 'Account not found' });

    if (name) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    await customer.save();

    res.json({ id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, address: customer.address });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/customers/forgot-password - Send OTP via Gmail
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    customer.resetOtp = otp;
    customer.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes validity
    await customer.save();

    await sendEmail({
      to: customer.email,
      subject: 'Password Reset OTP Verification',
      text: `Your password reset code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">Password Reset Request</h2>
          <p>You requested to reset your password. Use the OTP code below to continue:</p>
          <div style="background: #f4f6f8; padding: 14px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #ff6b35;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #777; margin-top: 16px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'Verification OTP has been sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please verify email server settings.' });
  }
});

// POST /api/customers/reset-password - Verify OTP and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const customer = await Customer.findOne({
      email: email.toLowerCase(),
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() },
    });

    if (!customer) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    customer.password = await bcrypt.hash(newPassword, 10);
    customer.resetOtp = null;
    customer.resetOtpExpire = null;
    await customer.save();

    res.json({ message: 'Password has been successfully updated. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;