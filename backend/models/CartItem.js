const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  cart_item_id: { type: Number, required: true, unique: true },
  cart_id: { type: Number, required: true },
  product_id: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

module.exports = mongoose.model('CartItem', itemSchema);
