// Run this once to create your first admin login:  node seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('Admin already exists with this email.');
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  await Admin.create({ email, password: hashed, name: 'Admin' });
  console.log(`Admin created: ${email}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
