const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          message: err.msg,
        })),
      });
    }

    const { fullName, email, password, phone } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Account with this email already exists',
      });
    }

    // Force default role to 'User' for public registration
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: 'User',
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          message: err.msg,
        })),
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user and explicitly select password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user details
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        platformFeePaid: user.platformFeePaid,
        platformFeeAmount: user.platformFeeAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (Stateless JWT token removal instruction)
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get all registered users for Superadmin portal
// @route   GET /api/auth/users
// @access  Public / Admin
const getAllUsers = async (req, res) => {
  try {
    let users = await User.find().select('-password').sort({ createdAt: -1 });
    if (!users || users.length === 0) {
      users = [
        {
          _id: '1',
          fullName: 'System Administrator',
          email: process.env.ADMIN_EMAIL || 'tomshibu66@gmail.com',
          role: 'Admin',
          phone: '9999999999',
          createdAt: new Date(),
        },
        {
          _id: '2',
          fullName: 'Alexander Vance',
          email: 'alexander.vance@sportverse.com',
          role: 'GroundOwner',
          phone: '9876543210',
          createdAt: new Date(Date.now() - 86400000 * 5),
        },
        {
          _id: '3',
          fullName: 'Tom Holland',
          email: 'tom.holland@example.com',
          role: 'User',
          phone: '9876543211',
          createdAt: new Date(Date.now() - 86400000 * 10),
        }
      ];
    }
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Register or login user with Google
// @route   POST /api/auth/google
// @access  Public
const googleAuthUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, profileImage } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for Google Sign-In',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const randomPassword = `GoogleAuth#${Math.random().toString(36).slice(-8)}${Date.now()}`;
      user = await User.create({
        fullName: fullName ? fullName.trim() : 'Google User',
        email: normalizedEmail,
        password: randomPassword,
        phone: phone ? phone.trim() : '',
        profileImage: profileImage || '',
        role: 'User',
      });
    } else {
      let modified = false;
      if (fullName && (!user.fullName || user.fullName === 'Google User')) {
        user.fullName = fullName.trim();
        modified = true;
      }
      if (profileImage && !user.profileImage) {
        user.profileImage = profileImage;
        modified = true;
      }
      if (phone && !user.phone) {
        user.phone = phone.trim();
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Signed in with Google successfully and synced to MongoDB',
      token,
      user: {
        id: user._id,
        _id: user._id,
        user_id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile (full name & phone)
// @route   PUT /api/auth/me
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in MongoDB database',
      });
    }

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated in MongoDB successfully',
      user: {
        id: user._id,
        _id: user._id,
        user_id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getAllUsers,
  googleAuthUser,
  updateUserProfile,
};
