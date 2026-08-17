const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  booking_id: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ground: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground' },
  user_id: { type: mongoose.Schema.Types.Mixed, required: true },
  user_name: { type: String, default: 'Guest User' },
  ground_id: { type: mongoose.Schema.Types.Mixed, required: true },
  ground_name: { type: String, default: 'Sports Ground' },
  sport_type: { type: String, required: true },
  date: { type: String, required: true },
  slot_time: { type: String, required: true },
  total_price: { type: Number, required: true },
  payment_status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
  booking_status: { type: String, enum: ['Upcoming', 'Confirmed', 'Completed', 'Cancelled'], default: 'Upcoming' },
  admin_approval: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approved_at: { type: Date },
  qr_code: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);

