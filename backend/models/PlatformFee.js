const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  fee_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  payment_id: Number,
  fee_type: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  paid_at: Date
});

module.exports = mongoose.model('PlatformFee', feeSchema);
