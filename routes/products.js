const express = require('express');
const Product = require('../models/Product');
const { protectAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.onSale === 'true') filter.salePrice = { $ne: null, $gt: 0 };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products - Admin
router.post('/', protectAdmin, upload.array('images', 8), async (req, res) => {
  try {
    const imagePaths = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const product = new Product({
      ...req.body,
      salePrice: req.body.salePrice ? Number(req.body.salePrice) : null,
      images: imagePaths,
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id - Admin (With selective image deletion)
router.put('/:id', protectAdmin, upload.array('images', 8), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Existing images jo retain karni hain
    let keptImages = [];
    if (req.body.existingImages) {
      keptImages = Array.isArray(req.body.existingImages) 
        ? req.body.existingImages 
        : [req.body.existingImages];
    }

    const newImagePaths = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const updatedImages = [...keptImages, ...newImagePaths];

    Object.assign(product, req.body);
    product.images = updatedImages;
    product.salePrice = req.body.salePrice ? Number(req.body.salePrice) : null;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products/:id/reviews - Public Customer Review
router.post('/:id/reviews', async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    if (!name || !rating || !comment) {
      return res.status(400).json({ message: 'Name, Rating and Comment are required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = {
      name,
      rating: Number(rating),
      comment,
    };

    product.reviews.unshift(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;