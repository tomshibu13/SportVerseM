const mongoose = require('mongoose');

const fMetricSchema = new mongoose.Schema({
  metric_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metric_type: { type: String, required: true },
  metric_value: { type: Number, required: true },
  unit: { type: String, required: true },
  recorded_at: { type: Date, required: true }
});

module.exports = mongoose.model('FitnessMetric', fMetricSchema);
