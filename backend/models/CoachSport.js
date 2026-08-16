const mongoose = require('mongoose');

const coachSportSchema = new mongoose.Schema({
  coach_sport_id: { type: Number, required: true, unique: true },
  coach_id: { type: Number, required: true },
  sport_id: { type: Number, required: true }
});

module.exports = mongoose.model('CoachSport', coachSportSchema);
