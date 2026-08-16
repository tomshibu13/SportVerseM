const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slot_id: { type: Number, required: true, unique: true },
  court_id: { type: Number, required: true },
  slot_date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  slot_status: { type: String, default: 'Available' }
});

module.exports = mongoose.model('BookingSlot', slotSchema);
