const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.Mixed },
  purpose: {
    type: String,
    enum: ['ground_booking', 'buying_product', 'ground_owner_registration', 'general_payment'],
    default: 'ground_booking'
  },
  booking_id: { type: String },
  order_id: { type: mongoose.Schema.Types.Mixed },
  ground_id: { type: mongoose.Schema.Types.Mixed },
  transaction_id: { type: String, required: true },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  payment_method: { type: String, default: 'Razorpay / UPI' },
  payment_status: { type: String, default: 'Success' },
  customer_name: { type: String },
  customer_email: { type: String },
  customer_phone: { type: String },
  receipt: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  paid_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
