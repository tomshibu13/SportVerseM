const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ground = require('../models/Ground');
const generateToken = require('../utils/generateToken');
const { sendStationOwnerApprovalEmail } = require('../utils/emailService');

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

    const { fullName, email, password, phone, role } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Account with this email already exists',
      });
    }

    const requestedRole = role && ['User', 'GroundOwner', 'ShopOwner', 'Admin'].includes(role) ? role : 'User';
    const initialApprovalStatus = requestedRole === 'GroundOwner' || requestedRole === 'ShopOwner' ? 'Pending' : 'Approved';
    const initialIsApproved = initialApprovalStatus === 'Approved';

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      authProvider: 'local',
      isGoogleAuth: false,
      phone: phone ? phone.trim() : '',
      role: requestedRole,
      approvalStatus: initialApprovalStatus,
      isApproved: initialIsApproved,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        approvalStatus: user.approvalStatus,
        isApproved: user.isApproved,
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
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Find user and explicitly select password & stationPassword
    const user = await User.findOne({ email: normalizedEmail }).select('+password +stationPassword');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. Please register or sign in with Google.',
      });
    }

    const isAppPasswordValid = user.password ? await user.matchPassword(password) : false;
    const isStationPasswordValid = user.stationPassword ? await user.matchStationPassword(password) : false;

    if (!isAppPasswordValid && !isStationPasswordValid) {
      if (user.isGoogleAuth || user.authProvider === 'google') {
        return res.status(401).json({
          success: false,
          message: 'This account was registered with Google. Please use "Continue with Google" to log in, or set a password in your profile.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        approvalStatus: user.approvalStatus || 'Approved',
        isApproved: user.isApproved !== undefined ? user.isApproved : true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate with Google OAuth 2.0
// @route   POST /api/auth/google
// @access  Public
// Flow: Flutter sends Google ID token → Node.js verifies via Google tokeninfo API
//       → creates/finds user in MongoDB → returns JWT to Flutter
const googleSignIn = async (req, res, next) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    // Verify the Google ID token using Google's public tokeninfo endpoint
    const https = require('https');
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;

    const googlePayload = await new Promise((resolve, reject) => {
      https.get(tokenInfoUrl, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (response.statusCode !== 200 || parsed.error) {
              reject(new Error(parsed.error_description || 'Invalid Google token'));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    const email = googlePayload.email;
    const name = googlePayload.name;
    const picture = googlePayload.picture;

    if (!email) {
      return res.status(401).json({ success: false, message: 'Could not extract email from Google token' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // New Google user — create account in MongoDB
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4);
      const requestedRole = role && ['User', 'GroundOwner', 'ShopOwner', 'Admin'].includes(role) ? role : 'User';
      const initialApprovalStatus = requestedRole === 'GroundOwner' || requestedRole === 'ShopOwner' ? 'Pending' : 'Approved';
      const initialIsApproved = initialApprovalStatus === 'Approved';

      user = await User.create({
        fullName: name || 'Google User',
        email: normalizedEmail,
        password: randomPassword,
        authProvider: 'google',
        isGoogleAuth: true,
        role: requestedRole,
        profileImage: picture || '',
        approvalStatus: initialApprovalStatus,
        isApproved: initialIsApproved,
      });
    } else {
      // Existing user logging in with Google: update avatar if missing
      if (!user.profileImage && picture) {
        user.profileImage = picture;
        await user.save();
      }
    }

    // Issue JWT token for Flutter to use in subsequent API calls
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      isNewUser,
      token,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        approvalStatus: user.approvalStatus || 'Approved',
        isApproved: user.isApproved !== undefined ? user.isApproved : true,
      },
    });
  } catch (error) {
    console.error('Google Sign-In Error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid Google token: ' + error.message });
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

    const isApprovedOwner = (user.role === 'GroundOwner' || user.role === 'ShopOwner') && 
      (user.approvalStatus === 'Approved' || user.isApproved === true);
    
    let stationPass = user.stationPasswordDisplay || '';
    if (isApprovedOwner && !stationPass) {
      const suffix = (user._id ? user._id.toString().slice(-4) : '7892').toUpperCase();
      stationPass = `SV-Station#${suffix}`;
      user.stationPasswordDisplay = stationPass;
      try { await user.save(); } catch (_) {}
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        location: user.location || '',
        favoriteSport: user.favoriteSport || '',
        bio: user.bio || '',
        profileImage: user.profileImage,
        platformFeePaid: user.platformFeePaid,
        platformFeeAmount: user.platformFeeAmount,
        approvalStatus: user.approvalStatus || 'Approved',
        isApproved: user.isApproved !== undefined ? user.isApproved : true,
        stationPortalUrl: process.env.STATION_OWNER_PORTAL_URL || 'http://localhost:5174',
        stationPassword: stationPass,
        ownerDashboardPassword: stationPass,
        hasStationPassword: !!stationPass,
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

const seedUsersIfEmpty = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const adminEmail = (process.env.ADMIN_EMAIL || 'tomshibu666@gmail.com').toLowerCase().trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      await User.create([
        {
          fullName: 'System Administrator',
          email: adminEmail,
          password: adminPassword,
          role: 'Admin',
          phone: '9999999999',
          approvalStatus: 'Approved',
          isApproved: true,
        },
      ]);
      console.log('🌱 Seeded Superadmin user into MongoDB database');
    }
  } catch (error) {
    console.error('❌ Failed to seed users:', error.message);
  }
};

// @desc    Get all registered users for Superadmin portal
// @route   GET /api/auth/users
// @access  Public / Admin
const getAllUsers = async (req, res) => {
  try {
    await seedUsersIfEmpty();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      users: users || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// @desc    Update current user profile (full name & phone)
// @route   PUT /api/auth/me
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const { fullName, phone, location, favoriteSport, bio, role } = req.body;
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
    if (location !== undefined) user.location = location.trim();
    if (favoriteSport !== undefined) user.favoriteSport = favoriteSport.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (role !== undefined && ['User', 'GroundOwner', 'ShopOwner', 'Admin'].includes(role)) {
      user.role = role;
      if (role === 'GroundOwner' || role === 'ShopOwner') {
        user.approvalStatus = 'Pending';
        user.isApproved = false;
      } else {
        user.approvalStatus = 'Approved';
        user.isApproved = true;
      }
    }

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
        phone: user.phone || '',
        location: user.location || '',
        favoriteSport: user.favoriteSport || '',
        bio: user.bio || '',
        profileImage: user.profileImage,
        approvalStatus: user.approvalStatus || 'Approved',
        isApproved: user.isApproved !== undefined ? user.isApproved : true,
        stationPortalUrl: process.env.STATION_OWNER_PORTAL_URL || 'http://localhost:5174',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve user account (GroundOwner / ShopOwner)
// @route   PUT /api/auth/users/:id/approve
// @access  Admin
const approveUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { approvalStatus, isApproved, status } = req.body;
    const newStatus = approvalStatus || status || (isApproved === true ? 'Approved' : 'Rejected');
    const newIsApproved = newStatus === 'Approved';

    let user = null;
    try {
      user = await User.findById(userId);
    } catch (e) { }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in MongoDB database' });
    }

    user.approvalStatus = newStatus;
    user.isApproved = newIsApproved;

    let generatedPassword = null;
    const portalUrl = process.env.STATION_OWNER_PORTAL_URL || 'http://localhost:5174';

    // Generate unique password when approving GroundOwner or ShopOwner for Station Owner Dashboard ONLY
    if (newStatus === 'Approved' && (user.role === 'GroundOwner' || user.role === 'ShopOwner')) {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      generatedPassword = `SV-Station#${randomSuffix}`;
      const salt = await bcrypt.genSalt(10);
      user.stationPassword = await bcrypt.hash(generatedPassword, salt);
      user.stationPasswordDisplay = generatedPassword;
      // NOTE: user.password (entered by user in mobile app) is strictly preserved and NEVER modified!
    }

    await user.save();

    // ── Also update all Ground venues owned by this user in MongoDB ──
    const targetGroundStatus = newStatus === 'Approved' ? 'Approved' : 'Pending';
    try {
      const gRes = await Ground.updateMany(
        {
          $or: [
            { owner_id: user._id },
            { owner_id: String(user._id) },
            { owner_id: user.id },
            { owner_id: String(user.id) }
          ]
        },
        { status: targetGroundStatus }
      );
      console.log(`🏟️ Updated ${gRes.modifiedCount} ground(s) to status ${targetGroundStatus} for owner ${user.email}`);
    } catch (gErr) {
      console.error('⚠️ Failed to update owner grounds status:', gErr.message);
    }

    // ── Create In-App Notification in MongoDB with explicit Portal URL and New Password ──
    if (newStatus === 'Approved') {
      try {
        const { createInAppNotification } = require('./notificationController');
        const notifMsg = generatedPassword
          ? `🎉 Congratulations ${user.fullName}! Your SportVerse Station Owner account has been APPROVED by Admin!\n\n🌐 Station Portal URL: ${portalUrl}\n🔑 Station Login Password: ${generatedPassword}\n📧 Login Email: ${user.email}\n\nYou can access your Station Owner Dashboard anytime at ${portalUrl} to manage your arenas, courts, time slots, and player check-ins.`
          : `🎉 Congratulations ${user.fullName}! Your SportVerse registration has been APPROVED by Admin.`;
        await createInAppNotification({
          userId: user._id,
          title: '🎉 Station Owner Approved & Credentials',
          message: notifMsg,
          notificationType: 'Approval',
          data: {
            portalUrl,
            stationPassword: generatedPassword,
            email: user.email,
          }
        });
      } catch (nErr) {
        console.error('⚠️ Failed to create in-app notification:', nErr.message);
      }
    }

    console.log(`👑 User ${user.email} (${user.fullName}) status updated to ${newStatus}. Station Password generated: ${generatedPassword ? 'YES' : 'NO'}`);

    // ── Send approval email via SMTP / Nodemailer ──────────────
    let emailResult = null;
    if (generatedPassword) {
      try {
        emailResult = await sendStationOwnerApprovalEmail({
          fullName: user.fullName,
          email: user.email,
          generatedPassword,
          portalUrl,
        });
        if (emailResult.mode === 'ethereal' && emailResult.previewUrl) {
          console.log(`📧 [Email/Test] Preview URL: ${emailResult.previewUrl}`);
        }
      } catch (emailErr) {
        // Non-fatal — log the error but do not block the API response
        console.error(`❌ [Email] Failed to send approval email to ${user.email}:`, emailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `User status updated to ${newStatus}`,
      emailSent: !!generatedPassword,
      firebaseAuthEnabled: !!(emailResult && emailResult.usedFirebaseResetLink),
      credentials: generatedPassword ? {
        fullName: user.fullName,
        email: user.email,
        generatedPassword,
        portalUrl,
        role: user.role,
      } : null,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleSignIn,
  getCurrentUser,
  logoutUser,
  getAllUsers,
  updateUserProfile,
  approveUser,
  seedUsersIfEmpty,
};


