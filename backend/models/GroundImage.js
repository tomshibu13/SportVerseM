const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  image_id: { type: Number, required: true, unique: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  image_url: { type: String, required: true },
  is_primary: { type: Boolean, default: false },
  uploaded_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroundImage', imageSchema);
