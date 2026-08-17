const mongoose = require('mongoose');

const notifSchema = new mongoose.Schema({
  notification_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.Mixed, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  notification_type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notifSchema);
