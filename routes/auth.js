const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { protectAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 1. Send OTP to Admin's Current Registered Email (Profile Update ke liye)
router.post('/send-profile-otp', protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id || req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.emailChangeOtp = otp;
    admin.emailChangeOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await admin.save();

    await sendEmail({
      to: admin.email,
      subject: 'Admin Security Verification OTP',
      text: `Your security verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">Security Verification</h2>
          <p>You requested to update your admin profile. Your verification code is:</p>
          <div style="background: #f4f6f8; padding: 14px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #ff6b35;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #777; margin-top: 16px;">This code is valid for 10 minutes.</p>
        </div>
      `,
    });

    res.json({ message: 'Verification OTP code has been sent to your current email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Verify OTP & Update Email / Password (Without Current Password)
router.put('/update-profile', protectAdmin, async (req, res) => {
  try {
    const { otp, newEmail, newPassword } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP code is required' });

    const admin = await Admin.findById(req.admin._id || req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Verify OTP
    if (admin.emailChangeOtp !== otp || !admin.emailChangeOtpExpire || admin.emailChangeOtpExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    let updatedFields = [];

    // Agar naya email diya gaya hai
    if (newEmail && newEmail.trim() !== '' && newEmail.toLowerCase() !== admin.email) {
      const exists = await Admin.findOne({ email: newEmail.toLowerCase() });
      if (exists) return res.status(400).json({ message: 'This email is already registered with another admin' });
      admin.email = newEmail.toLowerCase();
      updatedFields.push('Email');
    }

    // Agar naya password diya gaya hai
    if (newPassword && newPassword.trim() !== '') {
      admin.password = await bcrypt.hash(newPassword.trim(), 10);
      updatedFields.push('Password');
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one field (Email or Password) to update' });
    }

    // Clear OTP after successful update
    admin.emailChangeOtp = null;
    admin.emailChangeOtpExpire = null;
    await admin.save();

    res.json({
      message: `${updatedFields.join(' and ')} successfully updated!`,
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Admin Forgot Password Request (Jab Admin login page par password bhool jaye)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) return res.status(404).json({ message: 'No admin account found with this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.emailChangeOtp = otp;
    admin.emailChangeOtpExpire = Date.now() + 10 * 60 * 1000;
    await admin.save();

    await sendEmail({
      to: admin.email,
      subject: 'Admin Password Reset OTP',
      text: `Your OTP code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">Admin Password Reset</h2>
          <p>You requested to reset your admin password. Your OTP code is:</p>
          <div style="background: #f4f6f8; padding: 14px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #ff6b35;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #777; margin-top: 16px;">This code will expire in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: 'OTP code has been sent to your admin email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Admin Reset Password Confirm
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
      emailChangeOtp: otp,
      emailChangeOtpExpire: { $gt: Date.now() }
    });

    if (!admin) return res.status(400).json({ message: 'Invalid or expired OTP code' });

    admin.password = await bcrypt.hash(newPassword.trim(), 10);
    admin.emailChangeOtp = null;
    admin.emailChangeOtpExpire = null;
    await admin.save();

    res.json({ message: 'Password successfully reset! You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;