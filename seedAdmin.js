const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URL = "mongodb+srv://aslamabdullah288_db_user:Abd12345@abdullah.2zmjnx6.mongodb.net/?retryWrites=true&w=majority&appName=Abdullah";

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Admin' }
});
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB Atlas for seeding...");

    const email = "aslamabdullah288@gmail.com";
    const password = "Abd123456789"; // Yeh aapka login password hoga

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists with this email.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ email, password: hashedPassword, name: 'Admin' });

    console.log(`Successfully created Admin! Email: ${email}, Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  }
}

createAdmin();