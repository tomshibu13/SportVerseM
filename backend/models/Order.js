const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order_reference: { type: String, required: true, unique: true },
  total_amount: { type: Number, required: true },
  order_status: { type: String, default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
