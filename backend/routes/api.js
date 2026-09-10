const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateGround,
  validateSlot,
  validateBooking,
  validateProduct,
} = require('../middleware/validationMiddleware');

const authController = require('../controllers/authController');
const groundController = require('../controllers/groundController');
const bookingController = require('../controllers/bookingController');
const shopController = require('../controllers/shopController');
const aiController = require('../controllers/aiController');
const notificationController = require('../controllers/notificationController');
const paymentController = require('../controllers/paymentController');
const slotController = require('../controllers/slotController');

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SportVerse AI Backend running successfully', time: new Date() });
});

// Auth Routes
router.post('/auth/register', validateRegister, authController.registerUser);
router.post('/auth/login', validateLogin, authController.loginUser);
router.get('/auth/users', protect, authorizeRoles('Admin'), authController.getAllUsers);
router.put('/auth/users/:id/approve', protect, authorizeRoles('Admin'), authController.approveUser);

// Notification Routes
router.get('/notifications', protect, notificationController.getUserNotifications);
router.get('/notifications/user/:userId', protect, notificationController.getUserNotifications);
router.put('/notifications/:id/read', protect, notificationController.markAsRead);

// Dashboard Routes
router.get('/owner/dashboard/:ownerId', protect, authorizeRoles('GroundOwner', 'Admin'), groundController.getOwnerDashboardStats);

// Ground Routes
router.get('/grounds', groundController.getAllGrounds);
router.get('/grounds/owner/:ownerId', protect, authorizeRoles('GroundOwner', 'Admin'), groundController.getGroundsByOwner);
router.get('/grounds/:id', groundController.getGroundById);
router.post('/grounds', protect, validateGround, groundController.createGround);
router.put('/grounds/:id', protect, authorizeRoles('GroundOwner', 'Admin'), validateGround, groundController.updateGround);
router.put('/grounds/:id/approve', protect, authorizeRoles('Admin'), groundController.approveGround);
router.put('/grounds/:id/status', protect, authorizeRoles('Admin'), groundController.approveGround);
router.delete('/grounds/:id', protect, authorizeRoles('GroundOwner', 'Admin'), groundController.deleteGround);

// Slot Routes
router.get('/slots', slotController.getSlots);
router.post('/slots', protect, authorizeRoles('GroundOwner', 'Admin'), validateSlot, slotController.createSlot);
router.post('/slots/generate', protect, authorizeRoles('GroundOwner', 'Admin'), slotController.generateSlots);
router.put('/slots/:id', protect, authorizeRoles('GroundOwner', 'Admin'), slotController.updateSlot);
router.delete('/slots/:id', protect, authorizeRoles('GroundOwner', 'Admin'), slotController.deleteSlot);

// Booking Routes
router.get('/bookings', protect, authorizeRoles('Admin'), bookingController.getAllBookings);
router.get('/bookings/owner/:ownerId', protect, authorizeRoles('GroundOwner', 'Admin'), bookingController.getOwnerBookings);
router.get('/bookings/ground/:groundId', bookingController.getGroundBookedSlots);
router.post('/bookings', protect, validateBooking, bookingController.createBooking);
router.get('/bookings/user/:userId', protect, bookingController.getUserBookings);
router.put('/bookings/:bookingId/approve', protect, authorizeRoles('Admin'), bookingController.approveBooking);
router.put('/bookings/:bookingId/checkin', protect, authorizeRoles('GroundOwner', 'Admin'), bookingController.checkInBooking);
router.post('/bookings/checkin', protect, authorizeRoles('GroundOwner', 'Admin'), bookingController.checkInBooking);
router.put('/bookings/cancel/:bookingId', protect, bookingController.cancelBooking);

// Shop Routes
router.get('/products', shopController.getAllProducts);
router.get('/products/:id', shopController.getProductById);
router.post('/products', protect, authorizeRoles('ShopOwner', 'Admin'), validateProduct, shopController.createProduct);
router.put('/products/:id', protect, authorizeRoles('ShopOwner', 'Admin'), validateProduct, shopController.updateProduct);
router.get('/orders', protect, authorizeRoles('Admin', 'ShopOwner'), shopController.getAllOrders);
router.post('/orders', protect, shopController.createOrder);
router.get('/orders/user/:userId', protect, shopController.getUserOrders);

// Razorpay Payment Routes
router.get('/payment/config', paymentController.getPaymentConfig);
router.post('/payment/create-order', protect, paymentController.createRazorpayOrder);
router.post('/payment/verify-payment', protect, paymentController.verifyPayment);
router.get('/payment/history/:userId', protect, paymentController.getUserPaymentHistory);

// AI Recommendation Routes
router.get('/ai/recommendations', aiController.getRecommendations);
router.post('/ai/chat', aiController.aiAssistantChat);

module.exports = router;
