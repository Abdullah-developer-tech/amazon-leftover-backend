const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    price: Number,
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['COD', 'MANUAL_TRANSFER', 'STRIPE'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    manualTransferReference: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'on_the_way', 'delivered', 'cancelled'],
      default: 'placed',
    },
    estimatedDelivery: { type: String, default: '' }, // 🔥 Auto-calculated delivery time
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);