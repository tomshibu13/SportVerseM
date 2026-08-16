const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  facility_id: { type: Number, required: true, unique: true },
  facility_name: { type: String, required: true, unique: true },
  description: String,
  icon_url: String
});

module.exports = mongoose.model('Facility', facilitySchema);
