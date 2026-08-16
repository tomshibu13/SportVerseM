const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  coach_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  experience_years: Number,
  bio: String,
  certification: String,
  hourly_rate: Number,
  verification_status: { type: String, default: 'Pending' }
});

module.exports = mongoose.model('Coach', coachSchema);
