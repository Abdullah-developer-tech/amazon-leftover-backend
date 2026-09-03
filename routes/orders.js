const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { protectAdmin, protectCustomer } = require('../middleware/auth');
const { sendOrderEmail } = require('../utils/mailer');

const router = express.Router();

// POST /api/orders - Customer order place karne ke liye
router.post('/', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      const foundCust = await Customer.findById(decoded.id || decoded._id);
      if (foundCust) {
        req.customer = foundCust;
      }
    } catch (e) {
      // Token invalid/expired - continue as guest
    }
  }
  next();
}, async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      address,
      location,
      items,
      totalAmount,
      paymentMethod,
    } = req.body;

    if (!customerName || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ message: 'Zaroori details missing hain' });
    }

    // Process items & fetch missing names/prices from database
    const processedItems = await Promise.all(
      items.map(async (i) => {
        const prodId = i.product || i.productId;
        let prodName = i.name;
        let prodPrice = i.price;
        let prodImage = i.image;

        if (prodId && (!prodName || !prodPrice)) {
          const foundProduct = await Product.findById(prodId);
          if (foundProduct) {
            prodName = prodName || foundProduct.name;
            prodPrice = prodPrice !== undefined ? prodPrice : foundProduct.price;
            prodImage = prodImage || (foundProduct.images && foundProduct.images[0]);
          }
        }

        return {
          product: prodId,
          name: prodName || 'Product',
          image: prodImage || '',
          quantity: Number(i.quantity) || 1,
          price: Number(prodPrice) || 0,
        };
      })
    );

    // Auto Calculate Delivery Time (In-City Faisalabad vs Out-of-City)
    const lowerAddress = address.toLowerCase();
    const isLocal = lowerAddress.includes('faisalabad') || lowerAddress.includes('sutar mandi') || lowerAddress.includes('dera');
    const estimatedDelivery = isLocal ? '3 to 5 Days (In-City Delivery)' : '6 to 8 Days (Out-of-City Delivery)';

    const order = new Order({
      customer: req.customer?._id || null, // Logged-in customer ID linkage
      customerName,
      phone,
      email: email || (req.customer ? req.customer.email : ''),
      address,
      location: location || { lat: 0, lng: 0 },
      items: processedItems,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      status: 'placed',
      estimatedDelivery,
    });

    await order.save();

    // Admin ko order alert email
    try {
      await sendOrderEmail(order);
    } catch (mailErr) {
      console.error('Order email error:', mailErr.message);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/orders/my - Customer ki apni order history (ID + Email dual match)
router.get('/my', protectCustomer, async (req, res) => {
  try {
    const query = {
      $or: [
        { customer: req.customer._id },
        { email: req.customer.email }
      ]
    };
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders - Admin orders list
router.get('/', protectAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id - Single order details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order nahi mila' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status - Admin update order status & Auto-reduce stock on Delivered
router.put('/:id/status', protectAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ message: 'Order nahi mila' });

    // Agar pehle delivered nahi tha aur ab admin ne status 'delivered' kar diya hai
    if (status === 'delivered' && order.status !== 'delivered') {
      for (const item of order.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            // Product stock mein se order quantity minus karna (minimum 0 tak)
            product.stock = Math.max(0, (product.stock || 0) - item.quantity);
            await product.save();
          }
        }
      }
      order.deliveredAt = new Date();
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;