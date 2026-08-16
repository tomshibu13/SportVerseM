const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  booking_id: String,
  rating: { type: Number, required: true },
  review_text: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
