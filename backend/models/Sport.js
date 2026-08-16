const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  sport_id: { type: Number, required: true, unique: true },
  sport_name: { type: String, required: true, unique: true },
  description: String,
  icon_url: String
});

module.exports = mongoose.model('Sport', sportSchema);
