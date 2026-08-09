const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const groundController = require('../controllers/groundController');
const bookingController = require('../controllers/bookingController');
const shopController = require('../controllers/shopController');
const aiController = require('../controllers/aiController');

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SportVerse AI Backend running successfully', time: new Date() });
});

// Auth Routes
router.post('/auth/register', authController.registerUser);
router.post('/auth/login', authController.loginUser);
router.get('/auth/users', authController.getAllUsers);

// Ground Routes
router.get('/grounds', groundController.getAllGrounds);
router.get('/grounds/:id', groundController.getGroundById);
router.post('/grounds', groundController.createGround);

// Booking Routes
router.post('/bookings', bookingController.createBooking);
router.get('/bookings/user/:userId', bookingController.getUserBookings);
router.put('/bookings/cancel/:bookingId', bookingController.cancelBooking);

// Shop Routes
router.get('/products', shopController.getAllProducts);
router.post('/products', shopController.createProduct);

// AI Recommendation Routes
router.get('/ai/recommendations', aiController.getRecommendations);
router.post('/ai/chat', aiController.aiAssistantChat);

module.exports = router;
