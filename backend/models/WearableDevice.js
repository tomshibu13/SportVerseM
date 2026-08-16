const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  device_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  device_name: { type: String, required: true },
  device_type: String,
  provider: String,
  connected_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WearableDevice', deviceSchema);
