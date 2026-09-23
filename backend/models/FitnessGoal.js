const mongoose = require('mongoose');

const fitnessGoalSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    goal_type: {
      type: String, // e.g., Steps, Calories, Distance
      required: true
    },
    target_value: {
      type: Number,
      required: true
    },
    period: {
      type: String, // e.g., Daily, Weekly, Monthly
      required: true
    },
    start_date: {
      type: Date
    },
    end_date: {
      type: Date
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

module.exports = mongoose.model('FitnessGoal', fitnessGoalSchema);
