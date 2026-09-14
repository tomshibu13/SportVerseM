const mongoose = require('mongoose');

const postLikeSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
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
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index: A user can only like a post ONCE
postLikeSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('PostLike', postLikeSchema);
