const mongoose = require('mongoose');

const groundFacilitySchema = new mongoose.Schema({
  ground_facility_id: { type: Number, required: true, unique: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  facility_id: { type: Number, required: true }
});

groundFacilitySchema.index({ ground_id: 1, facility_id: 1 }, { unique: true });

module.exports = mongoose.model('GroundFacility', groundFacilitySchema);
