const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    // Email change OTP fields
    pendingEmail: { type: String, default: null },
    emailChangeOtp: { type: String, default: null },
    emailChangeOtpExpire: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);