const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  team_member_id: { type: Number, required: true, unique: true },
  team_id: { type: Number, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joined_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeamMember', memberSchema);
