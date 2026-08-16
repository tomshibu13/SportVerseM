const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: { type: Number, required: true, unique: true },
  booking_id: { type: String, required: true },
  transaction_id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, required: true },
  payment_status: { type: String, required: true },
  paid_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
