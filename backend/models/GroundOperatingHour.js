const mongoose = require('mongoose');

const hourSchema = new mongoose.Schema({
  operating_hour_id: { type: Number, required: true, unique: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  day_of_week: { type: Number, required: true },
  opening_time: String,
  closing_time: String,
  is_closed: { type: Boolean, default: false }
});

module.exports = mongoose.model('GroundOperatingHour', hourSchema);
