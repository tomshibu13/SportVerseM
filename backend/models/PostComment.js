const mongoose = require('mongoose');

const postCommentSchema = new mongoose.Schema(
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
    user_name: {
      type: String,
      required: true,
      trim: true,
    },
    user_avatar: {
      type: String,
      default: '',
    },
    comment_text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

postCommentSchema.index({ post: 1, created_at: -1 });

module.exports = mongoose.model('PostComment', postCommentSchema);
