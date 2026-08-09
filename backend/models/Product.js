const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true }, // Football, Rackets, Shoes, Accessories
  price: { type: Number, required: true },
  original_price: { type: Number },
  rating: { type: Number, default: 4.7 },
  image: { type: String, required: true },
  description: { type: String },
  stock: { type: Number, default: 25 },
  shop_owner_id: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
