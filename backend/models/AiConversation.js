const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversation_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AiConversation', conversationSchema);
