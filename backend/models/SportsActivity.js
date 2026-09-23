const mongoose = require('mongoose');

const sportsActivitySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sport_id: {
      type: String,
      index: true
    },
    duration: {
      type: Number // e.g., in minutes
    },
    calories: {
      type: Number
    },
    distance: {
      type: Number
    },
    intensity: {
      type: String, // e.g., Low, Medium, High
    },
    activity_date: {
      type: Date,
      required: true,
      index: true
    },
    notes: {
      type: String
    },
    source: {
      type: String
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

module.exports = mongoose.model('SportsActivity', sportsActivitySchema);
