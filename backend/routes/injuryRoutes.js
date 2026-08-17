const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const {
  assessInjury,
  getInjuryHistory,
  getInjuryReport,
  injuryFollowUpChat,
  addRecoveryCheckIn,
  getPainProgressChart,
  deleteInjuryReport
} = require('../controllers/injuryController');

const injuryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.INJURY_RATE_LIMIT_MAX || '20'),
  message: { success: false, message: 'Too many injury assessment requests. Please wait.' }
});

router.post('/assess', protect, injuryLimiter, assessInjury);
router.get('/history', protect, getInjuryHistory);
router.get('/:id', protect, getInjuryReport);
router.post('/:id/chat', protect, injuryFollowUpChat);
router.post('/:id/checkin', protect, addRecoveryCheckIn);
router.get('/:id/chart', protect, getPainProgressChart);
router.delete('/:id', protect, deleteInjuryReport);

module.exports = router;
