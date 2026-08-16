const mongoose = require('mongoose');

const pImageSchema = new mongoose.Schema({
  product_image_id: { type: Number, required: true, unique: true },
  product_id: { type: Number, required: true },
  image_url: { type: String, required: true },
  is_primary: { type: Boolean, default: false }
});

module.exports = mongoose.model('ProductImage', pImageSchema);
