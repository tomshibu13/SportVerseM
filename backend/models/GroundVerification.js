const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  verification_id: { type: Number, required: true, unique: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, required: true },
  remarks: String,
  verified_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroundVerification', verificationSchema);
