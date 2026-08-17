const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const groundController = require('../controllers/groundController');
const bookingController = require('../controllers/bookingController');
const shopController = require('../controllers/shopController');
const aiController = require('../controllers/aiController');
const notificationController = require('../controllers/notificationController');
const paymentController = require('../controllers/paymentController');

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SportVerse AI Backend running successfully', time: new Date() });
});

// Auth Routes
router.post('/auth/register', authController.registerUser);
router.post('/auth/login', authController.loginUser);
router.get('/auth/users', authController.getAllUsers);
router.put('/auth/users/:id/approve', authController.approveUser);

// Notification Routes
router.get('/notifications', notificationController.getUserNotifications);
router.get('/notifications/user/:userId', notificationController.getUserNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

// Ground Routes
router.get('/grounds', groundController.getAllGrounds);
router.get('/grounds/:id', groundController.getGroundById);
router.post('/grounds', groundController.createGround);
router.put('/grounds/:id', groundController.updateGround);
router.put('/grounds/:id/approve', groundController.approveGround);
router.put('/grounds/:id/status', groundController.approveGround);
router.delete('/grounds/:id', groundController.deleteGround);

// Booking Routes
router.get('/bookings', bookingController.getAllBookings);
router.get('/bookings/ground/:groundId', bookingController.getGroundBookedSlots);
router.post('/bookings', bookingController.createBooking);
router.get('/bookings/user/:userId', bookingController.getUserBookings);
router.put('/bookings/:bookingId/approve', bookingController.approveBooking);
router.put('/bookings/:bookingId/checkin', bookingController.checkInBooking);
router.post('/bookings/checkin', bookingController.checkInBooking);
router.put('/bookings/cancel/:bookingId', bookingController.cancelBooking);

// Shop Routes
router.get('/products', shopController.getAllProducts);
router.get('/products/:id', shopController.getProductById);
router.post('/products', shopController.createProduct);
router.get('/orders', shopController.getAllOrders);
router.post('/orders', shopController.createOrder);
router.get('/orders/user/:userId', shopController.getUserOrders);

// Razorpay Payment Routes
router.get('/payment/config', paymentController.getPaymentConfig);
router.post('/payment/create-order', paymentController.createRazorpayOrder);
router.post('/payment/verify-payment', paymentController.verifyPayment);
router.get('/payment/history/:userId', paymentController.getUserPaymentHistory);

// AI Recommendation Routes
router.get('/ai/recommendations', aiController.getRecommendations);
router.post('/ai/chat', aiController.aiAssistantChat);

module.exports = router;
