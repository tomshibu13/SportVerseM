const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  reply_id: { type: Number, required: true, unique: true },
  review_id: { type: Number, required: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reply_text: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReviewReply', replySchema);
