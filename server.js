require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const customerAuthRoutes = require('./routes/customerAuth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const settingsRoutes = require('./routes/settings');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => res.send('Ecommerce API is running'));

const PORT = process.env.PORT || 5000;

// Fallback check taake agar MONGO_URI na mile toh local connection ki bajaye error saaf nazar aaye
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URI) {
  console.error('CRITICAL ERROR: MONGO_URI environment variable is not defined!');
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err.message));