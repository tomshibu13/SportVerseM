const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  court_id: { type: Number, required: true, unique: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  court_name: { type: String, required: true },
  court_number: { type: Number, required: true },
  court_type: String,
  status: { type: String, default: 'Available' }
});

module.exports = mongoose.model('Court', courtSchema);
