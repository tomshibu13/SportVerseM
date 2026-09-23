const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTodayMetrics,
  getHistoryMetrics,
  getWeeklyMetrics,
  getMonthlyMetrics,
  createRecord,
  updateRecord,
  deleteRecord,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
} = require('../controllers/fitnessController');

// All fitness routes require authentication
router.use(protect);

// --------------------------------------------------------------------------
// FITNESS METRICS (Records)
// --------------------------------------------------------------------------
router.get('/today', getTodayMetrics);
router.get('/history', getHistoryMetrics);
router.get('/weekly', getWeeklyMetrics);
router.get('/monthly', getMonthlyMetrics);

router.post('/records', createRecord);
router.put('/records/:id', updateRecord);
router.delete('/records/:id', deleteRecord);

// --------------------------------------------------------------------------
// SPORTS ACTIVITIES
// --------------------------------------------------------------------------
router.get('/activities', getActivities);
router.post('/activities', createActivity);
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);

// --------------------------------------------------------------------------
// FITNESS GOALS
// --------------------------------------------------------------------------
router.get('/goals', getGoals);
router.post('/goals', createGoal);
router.put('/goals/:id', updateGoal);
router.delete('/goals/:id', deleteGoal);

module.exports = router;
