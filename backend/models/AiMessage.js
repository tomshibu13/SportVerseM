const mongoose = require('mongoose');

const msgSchema = new mongoose.Schema({
  message_id: { type: Number, required: true, unique: true },
  conversation_id: { type: Number, required: true },
  sender_type: { type: String, required: true },
  message_text: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AiMessage', msgSchema);
