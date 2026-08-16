const mongoose = require('mongoose');

const tTeamSchema = new mongoose.Schema({
  tournament_team_id: { type: Number, required: true, unique: true },
  tournament_id: { type: Number, required: true },
  team_name: { type: String, required: true },
  captain_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('TournamentTeam', tTeamSchema);
