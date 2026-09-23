const mongoose = require('mongoose');

const fitnessMetricSchema = new mongoose.Schema(
  {
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    steps: { 
      type: Number, 
      default: 0 
    },
    calories: { 
      type: Number, 
      default: 0 
    },
    distance: { 
      type: Number, 
      default: 0 
    },
    active_minutes: { 
      type: Number, 
      default: 0 
    },
    heart_rate: { 
      type: Number 
    },
    resting_heart_rate: { 
      type: Number 
    },
    weight: {
      type: Number
    },
    height: {
      type: Number
    },
    bmi: {
      type: Number
    },
    body_fat: {
      type: Number
    },
    sleep_minutes: {
      type: Number
    },
    blood_pressure_systolic: {
      type: Number
    },
    blood_pressure_diastolic: {
      type: Number
    },
    blood_glucose: {
      type: Number
    },
    blood_oxygen: {
      type: Number
    },
    hydration: {
      type: Number
    },
    health_connect_raw_data: {
      type: mongoose.Schema.Types.Mixed
    },
    recorded_at: { 
      type: Date, 
      required: true,
      index: true
    },
    source: { 
      type: String 
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

module.exports = mongoose.model('FitnessMetric', fitnessMetricSchema);
