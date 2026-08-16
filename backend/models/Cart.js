const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  cart_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
