const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role_id: { type: Number, required: true, unique: true },
  role_name: { type: String, required: true, unique: true },
  description: String
});

module.exports = mongoose.model('Role', roleSchema);
