const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/config', paymentController.getPaymentConfig);
router.post('/create-order', paymentController.createRazorpayOrder);
router.post('/verify-payment', paymentController.verifyPayment);
router.post('/verify', paymentController.verifyPayment);
router.get('/history/:userId', paymentController.getUserPaymentHistory);

module.exports = router;
