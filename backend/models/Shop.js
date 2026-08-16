const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shop_id: { type: Number, required: true, unique: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop_name: { type: String, required: true },
  description: String,
  status: { type: String, default: 'Pending' }
});

module.exports = mongoose.model('Shop', shopSchema);
