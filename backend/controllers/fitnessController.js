const mongoose = require('mongoose');
const FitnessMetric = require('../models/FitnessMetric');
const SportsActivity = require('../models/SportsActivity');
const FitnessGoal = require('../models/FitnessGoal');

// Helper function to check for negative or invalid numbers
const isInvalidNumber = (val) => val !== undefined && val !== null && (isNaN(val) || val < 0);
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// --------------------------------------------------------------------------
// FITNESS METRICS
// --------------------------------------------------------------------------

exports.getTodayMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await FitnessMetric.find({
      user_id: req.user.userId,
      recorded_at: { $gte: today }
    }).sort({ recorded_at: -1 });

    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHistoryMetrics = async (req, res) => {
  try {
    const metrics = await FitnessMetric.find({ user_id: req.user.userId })
      .sort({ recorded_at: -1 })
      .limit(100); // Optional limiting

    res.status(200).json({ success: true, count: metrics.length, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWeeklyMetrics = async (req, res) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const metrics = await FitnessMetric.find({
      user_id: req.user.userId,
      recorded_at: { $gte: lastWeek }
    }).sort({ recorded_at: 1 });

    res.status(200).json({ success: true, count: metrics.length, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMonthlyMetrics = async (req, res) => {
  try {
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    
    const metrics = await FitnessMetric.find({
      user_id: req.user.userId,
      recorded_at: { $gte: lastMonth }
    }).sort({ recorded_at: 1 });

    res.status(200).json({ success: true, count: metrics.length, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRecord = async (req, res) => {
  try {
    const { 
      steps, calories, distance, active_minutes, heart_rate, resting_heart_rate, recorded_at, source,
      weight, height, bmi, body_fat, sleep_minutes, blood_pressure_systolic, blood_pressure_diastolic, 
      blood_glucose, blood_oxygen, hydration, health_connect_raw_data
    } = req.body;

    if (isInvalidNumber(steps) || isInvalidNumber(calories) || isInvalidNumber(distance) || isInvalidNumber(active_minutes)) {
      return res.status(400).json({ success: false, message: 'Invalid values. Negative numbers are not allowed.' });
    }

    const recordDate = recorded_at ? new Date(recorded_at) : new Date();
    if (isNaN(recordDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid recorded_at date.' });
    }

    const metric = new FitnessMetric({
      user_id: req.user.userId, // Strictly use authenticated user
      steps,
      calories,
      distance,
      active_minutes,
      heart_rate,
      resting_heart_rate,
      weight,
      height,
      bmi,
      body_fat,
      sleep_minutes,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      blood_glucose,
      blood_oxygen,
      hydration,
      health_connect_raw_data,
      recorded_at: recordDate,
      source
    });

    await metric.save();
    res.status(201).json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    const { 
      steps, calories, distance, active_minutes, heart_rate, resting_heart_rate, recorded_at, source,
      weight, height, bmi, body_fat, sleep_minutes, blood_pressure_systolic, blood_pressure_diastolic, 
      blood_glucose, blood_oxygen, hydration, health_connect_raw_data 
    } = req.body;
    
    if (isInvalidNumber(steps) || isInvalidNumber(calories) || isInvalidNumber(distance) || isInvalidNumber(active_minutes)) {
      return res.status(400).json({ success: false, message: 'Invalid values. Negative numbers are not allowed.' });
    }

    const metric = await FitnessMetric.findOne({ _id: req.params.id, user_id: req.user.userId });
    
    if (!metric) {
      return res.status(404).json({ success: false, message: 'Fitness record not found or not authorized.' });
    }

    if (steps !== undefined) metric.steps = steps;
    if (calories !== undefined) metric.calories = calories;
    if (distance !== undefined) metric.distance = distance;
    if (active_minutes !== undefined) metric.active_minutes = active_minutes;
    if (heart_rate !== undefined) metric.heart_rate = heart_rate;
    if (resting_heart_rate !== undefined) metric.resting_heart_rate = resting_heart_rate;
    if (weight !== undefined) metric.weight = weight;
    if (height !== undefined) metric.height = height;
    if (bmi !== undefined) metric.bmi = bmi;
    if (body_fat !== undefined) metric.body_fat = body_fat;
    if (sleep_minutes !== undefined) metric.sleep_minutes = sleep_minutes;
    if (blood_pressure_systolic !== undefined) metric.blood_pressure_systolic = blood_pressure_systolic;
    if (blood_pressure_diastolic !== undefined) metric.blood_pressure_diastolic = blood_pressure_diastolic;
    if (blood_glucose !== undefined) metric.blood_glucose = blood_glucose;
    if (blood_oxygen !== undefined) metric.blood_oxygen = blood_oxygen;
    if (hydration !== undefined) metric.hydration = hydration;
    if (health_connect_raw_data !== undefined) metric.health_connect_raw_data = health_connect_raw_data;
    if (source !== undefined) metric.source = source;
    
    if (recorded_at !== undefined) {
      const recordDate = new Date(recorded_at);
      if (isNaN(recordDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid date format.' });
      metric.recorded_at = recordDate;
    }

    await metric.save();
    res.status(200).json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    const metric = await FitnessMetric.findOneAndDelete({ _id: req.params.id, user_id: req.user.userId });
    if (!metric) {
      return res.status(404).json({ success: false, message: 'Fitness record not found or not authorized.' });
    }
    res.status(200).json({ success: true, message: 'Fitness record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// SPORTS ACTIVITIES
// --------------------------------------------------------------------------

exports.getActivities = async (req, res) => {
  try {
    const activities = await SportsActivity.find({ user_id: req.user.userId }).sort({ activity_date: -1 });
    res.status(200).json({ success: true, count: activities.length, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const { sport_id, duration, calories, distance, intensity, activity_date, notes, source } = req.body;

    if (isInvalidNumber(duration) || isInvalidNumber(calories) || isInvalidNumber(distance)) {
      return res.status(400).json({ success: false, message: 'Invalid values. Negative numbers are not allowed.' });
    }

    const activityDate = activity_date ? new Date(activity_date) : new Date();
    if (isNaN(activityDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid activity_date.' });
    }

    const activity = new SportsActivity({
      user_id: req.user.userId,
      sport_id,
      duration,
      calories,
      distance,
      intensity,
      activity_date: activityDate,
      notes,
      source
    });

    await activity.save();
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    const { sport_id, duration, calories, distance, intensity, activity_date, notes, source } = req.body;
    
    if (isInvalidNumber(duration) || isInvalidNumber(calories) || isInvalidNumber(distance)) {
      return res.status(400).json({ success: false, message: 'Invalid values. Negative numbers are not allowed.' });
    }

    const activity = await SportsActivity.findOne({ _id: req.params.id, user_id: req.user.userId });
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Sports activity not found or not authorized.' });
    }

    if (sport_id !== undefined) activity.sport_id = sport_id;
    if (duration !== undefined) activity.duration = duration;
    if (calories !== undefined) activity.calories = calories;
    if (distance !== undefined) activity.distance = distance;
    if (intensity !== undefined) activity.intensity = intensity;
    if (notes !== undefined) activity.notes = notes;
    if (source !== undefined) activity.source = source;

    if (activity_date !== undefined) {
      const actDate = new Date(activity_date);
      if (isNaN(actDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid date format.' });
      activity.activity_date = actDate;
    }

    await activity.save();
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    const activity = await SportsActivity.findOneAndDelete({ _id: req.params.id, user_id: req.user.userId });
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Sports activity not found or not authorized.' });
    }
    res.status(200).json({ success: true, message: 'Sports activity deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// FITNESS GOALS
// --------------------------------------------------------------------------

exports.getGoals = async (req, res) => {
  try {
    const goals = await FitnessGoal.find({ user_id: req.user.userId }).sort({ created_at: -1 });
    res.status(200).json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { goal_type, target_value, period, start_date, end_date } = req.body;

    if (!goal_type || !target_value || !period) {
      return res.status(400).json({ success: false, message: 'Missing required fields for goal.' });
    }

    if (isInvalidNumber(target_value)) {
      return res.status(400).json({ success: false, message: 'Target value cannot be negative.' });
    }

    const goal = new FitnessGoal({
      user_id: req.user.userId,
      goal_type,
      target_value,
      period
    });

    if (start_date) {
      const sDate = new Date(start_date);
      if (isNaN(sDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid start_date.' });
      goal.start_date = sDate;
    }

    if (end_date) {
      const eDate = new Date(end_date);
      if (isNaN(eDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid end_date.' });
      goal.end_date = eDate;
    }

    await goal.save();
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    const { goal_type, target_value, period, start_date, end_date } = req.body;

    if (isInvalidNumber(target_value)) {
      return res.status(400).json({ success: false, message: 'Target value cannot be negative.' });
    }

    const goal = await FitnessGoal.findOne({ _id: req.params.id, user_id: req.user.userId });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Fitness goal not found or not authorized.' });
    }

    if (goal_type !== undefined) goal.goal_type = goal_type;
    if (target_value !== undefined) goal.target_value = target_value;
    if (period !== undefined) goal.period = period;

    if (start_date !== undefined) {
      const sDate = new Date(start_date);
      if (isNaN(sDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid start_date format.' });
      goal.start_date = sDate;
    }

    if (end_date !== undefined) {
      const eDate = new Date(end_date);
      if (isNaN(eDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid end_date format.' });
      goal.end_date = eDate;
    }

    await goal.save();
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    const goal = await FitnessGoal.findOneAndDelete({ _id: req.params.id, user_id: req.user.userId });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Fitness goal not found or not authorized.' });
    }
    res.status(200).json({ success: true, message: 'Fitness goal deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
