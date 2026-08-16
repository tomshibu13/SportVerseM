const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  tournament_id: { type: Number, required: true, unique: true },
  organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  sport_id: { type: Number, required: true },
  tournament_name: { type: String, required: true },
  description: String,
  tournament_date: { type: Date, required: true },
  registration_fee: { type: Number, default: 0 },
  prize_pool: { type: Number, default: 0 },
  max_teams: Number,
  status: { type: String, default: 'Upcoming' }
});

module.exports = mongoose.model('Tournament', tournamentSchema);
