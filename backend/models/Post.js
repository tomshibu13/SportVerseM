const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    user_name: {
      type: String,
      required: true,
      trim: true,
    },
    user_avatar: {
      type: String,
      default: '',
    },
    user_role: {
      type: String,
      default: 'Athlete',
    },
    caption: {
      type: String,
      required: [true, 'Post caption is required'],
      trim: true,
      maxlength: [2000, 'Caption cannot exceed 2000 characters'],
    },
    media_url: {
      type: String,
      required: [true, 'Media image/video URL is required'],
      trim: true,
    },
    media_type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    sport_category: {
      type: String,
      required: true,
      default: 'General',
      trim: true,
      index: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    like_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for fast feed querying and category filtering
postSchema.index({ created_at: -1 });
postSchema.index({ sport_category: 1, created_at: -1 });

module.exports = mongoose.model('Post', postSchema);
