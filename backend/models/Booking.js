const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  booking_id: { type: String, required: true, unique: true },
  user_id: { type: Number, required: true },
  user_name: { type: String, required: true },
  ground_id: { type: Number, required: true },
  ground_name: { type: String, required: true },
  sport_type: { type: String, required: true },
  date: { type: String, required: true },
  slot_time: { type: String, required: true },
  total_price: { type: Number, required: true },
  payment_status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
  booking_status: { type: String, enum: ['Upcoming', 'Completed', 'Cancelled'], default: 'Upcoming' },
  qr_code: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
