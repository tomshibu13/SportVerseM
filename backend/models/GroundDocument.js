const mongoose = require('mongoose');

const docSchema = new mongoose.Schema({
  document_id: { type: Number, required: true, unique: true },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  document_type: { type: String, required: true },
  document_url: { type: String, required: true },
  verification_status: { type: String, default: 'Pending' },
  uploaded_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroundDocument', docSchema);
