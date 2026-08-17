const mongoose = require('mongoose');

const groundSchema = new mongoose.Schema({
  ground_id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  sport_type: { type: String, required: true }, // e.g. Football, Badminton, Cricket, Tennis
  location: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, default: 11.2588 },
  longitude: { type: Number, default: 75.7804 },
  distance_km: { type: Number, default: 2.5 },
  price_per_hour: { type: Number, required: true },
  rating: { type: Number, default: 4.8 },
  review_count: { type: Number, default: 120 },
  images: [{ type: String }],
  facilities: [{ type: String }], // e.g. Lighting, Parking, Changing Room, Turf
  owner_id: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['Approved', 'Pending', 'Rejected', 'Active', 'Inactive'], default: 'Approved' },
  ai_score: { type: Number, default: 95 },
  available_slots: [{
    slot_id: String,
    time: String,
    is_booked: { type: Boolean, default: false },
    price: Number
  }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ground', groundSchema);
