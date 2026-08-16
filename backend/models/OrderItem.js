const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order_item_id: { type: Number, required: true, unique: true },
  order_id: { type: Number, required: true },
  product_id: { type: Number, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true }
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
