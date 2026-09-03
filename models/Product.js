const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: null },
    category: { type: String, default: 'General' },
    subcategory: { type: String, default: '' }, // Added subcategory field
    stock: { type: Number, default: 0 },
    outOfStock: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    animation: { type: String, default: 'anim-hover-lift' },
    images: [{ type: String }],
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);