const express = require('express');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/reviews/product/:productId - public
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reviews - only allowed once order status is 'delivered'
router.post('/', async (req, res) => {
  try {
    const { productId, orderId, customerName, rating, comment } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'You can only review a product after it has been delivered' });
    }

    const review = new Review({ product: productId, order: orderId, customerName, rating, comment });
    await review.save();

    // update product rating average
    const allReviews = await Review.find({ product: productId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, { rating: avg, numReviews: allReviews.length });

    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
