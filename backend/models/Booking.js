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
  court_id: { type: String, default: 'Court 1', trim: true },
  slot_id: { type: String, default: null },
  date: { type: String, required: true },
  slot_time: { type: String, required: true },
  total_price: { type: Number, required: true },
  payment_status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
  booking_status: { type: String, enum: ['Upcoming', 'Confirmed', 'Completed', 'Cancelled'], default: 'Upcoming' },
  admin_approval: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
  approved_at: { type: Date },
  qr_code: { type: String },
  is_qr_expired: { type: Boolean, default: false },
  qr_scanned: { type: Boolean, default: false },
  scanned_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

bookingSchema.index({ ground_id: 1, court_id: 1, date: 1, slot_time: 1 });
bookingSchema.index({ ground: 1, date: 1 });
bookingSchema.index({ user_id: 1 });

module.exports = mongoose.model('Booking', bookingSchema);


