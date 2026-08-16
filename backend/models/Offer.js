const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offer_id: { type: Number, required: true, unique: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  offer_name: { type: String, required: true },
  discount_type: { type: String, required: true },
  discount_value: { type: Number, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  status: { type: String, default: 'Active' }
});

module.exports = mongoose.model('Offer', offerSchema);
