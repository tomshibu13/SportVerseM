const express = require('express');
const { body } = require('express-validator');
const {
  registerUser,
  loginUser,
  googleSignIn,
  getCurrentUser,
  logoutUser,
  updateUserProfile,
  approveUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation Rules for Registration
const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian mobile number'),
];

// Validation Rules for Login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Auth Endpoints
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.post('/google', googleSignIn); // Google OAuth 2.0: Flutter sends ID token, Node.js verifies & returns JWT
router.post('/logout', logoutUser);
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateUserProfile);
router.put('/users/:id/approve', approveUser);

module.exports = router;

