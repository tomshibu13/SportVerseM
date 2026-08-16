const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  favorite_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  created_at: { type: Date, default: Date.now }
});

favoriteSchema.index({ user_id: 1, ground_id: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteGround', favoriteSchema);
