const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  pricing_id: { type: Number, required: true, unique: true },
  court_id: { type: Number, required: true },
  sport_id: { type: Number, required: true },
  price_per_hour: { type: Number, required: true },
  valid_from: { type: Date, required: true },
  valid_to: Date
});

module.exports = mongoose.model('CourtPricing', pricingSchema);
