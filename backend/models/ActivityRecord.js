const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  activity_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  device_id: Number,
  activity_type: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: Date,
  duration_minutes: Number,
  calories: Number,
  distance_km: Number,
  steps: Number
});

module.exports = mongoose.model('ActivityRecord', recordSchema);
