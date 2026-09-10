const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    ground_id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    ground: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ground',
      index: true,
    },
    court_id: {
      type: String,
      required: true,
      default: 'Court 1',
      trim: true,
    },
    date: {
      type: String,
      required: true,
      index: true, // Format: YYYY-MM-DD
    },
    start_time: {
      type: String,
      required: true,
      trim: true, // e.g., '06:00 AM'
    },
    end_time: {
      type: String,
      required: true,
      trim: true, // e.g., '07:00 AM'
    },
    slot_time: {
      type: String,
      required: true,
      trim: true, // e.g., '06:00 AM - 07:00 AM'
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Blocked', 'Expired'],
      default: 'Available',
      index: true,
    },
    booking_id: {
      type: String,
      default: null,
    },
    booked_by_user_id: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound unique index to prevent duplicate slot generation for the same ground, date, court, and time
slotSchema.index(
  { ground_id: 1, date: 1, court_id: 1, slot_time: 1 },
  { unique: true }
);

module.exports = mongoose.model('Slot', slotSchema);
