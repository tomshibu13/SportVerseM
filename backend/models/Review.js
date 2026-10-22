const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
  user_name: { type: String, default: 'Sports Player' },
  user_avatar: { type: String, default: '' },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  booking_id: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
