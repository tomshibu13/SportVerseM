const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    stationPassword: {
      type: String,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'station'],
      default: 'local',
    },
    isGoogleAuth: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['User', 'GroundOwner', 'ShopOwner', 'Admin'],
      default: 'User',
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    favoriteSport: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    platformFeePaid: {
      type: Boolean,
      default: false,
    },
    platformFeeAmount: {
      type: Number,
      default: 0,
    },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to compare station owner password
userSchema.methods.matchStationPassword = async function (enteredPassword) {
  if (!this.stationPassword) return false;
  return await bcrypt.compare(enteredPassword, this.stationPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
