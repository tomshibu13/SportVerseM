const mongoose = require('mongoose');
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostComment = require('../models/PostComment');
const User = require('../models/User');

const isObjectIdString = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());

// Helper: Convert ID to string for comparison
const toIdString = (id) => (id ? id.toString() : '');

// @desc    Get community feed posts (with optional category filter & pagination)
// @route   GET /api/community/posts
// @access  Public / Optional Auth
exports.getPosts = async (req, res) => {
  try {
    const { sport, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { is_active: true };

    if (sport && sport !== 'All' && sport.trim() !== '') {
      query.sport_category = new RegExp(`^${sport.trim()}$`, 'i');
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ caption: searchRegex }, { user_name: searchRegex }, { location: searchRegex }];
    }

    const [posts, totalCount] = await Promise.all([
      Post.find(query).sort({ created_at: -1 }).skip(skip).limit(limitNum),
      Post.countDocuments(query),
    ]);

    // Check if requester is authenticated to determine is_liked and is_owner
    const requesterId = req.user?.userId ? req.user.userId.toString() : null;
    let likedPostIds = new Set();

    if (requesterId && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const userLikes = await PostLike.find({
        post: { $in: postIds },
        $or: [
          ...(isObjectIdString(requesterId) ? [{ user: new mongoose.Types.ObjectId(requesterId) }] : []),
          { user_id: requesterId },
        ],
      }).select('post');

      likedPostIds = new Set(userLikes.map((l) => l.post.toString()));
    }

    const formattedPosts = posts.map((post) => {
      const postObj = post.toObject();
      const postIdStr = post._id.toString();
      const postUserIdStr = post.user_id ? post.user_id.toString() : (post.user ? post.user.toString() : '');

      return {
        ...postObj,
        post_id: postIdStr,
        is_liked: likedPostIds.has(postIdStr),
        is_owner: requesterId ? (postUserIdStr === requesterId || (post.user && post.user.toString() === requesterId)) : false,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedPosts.length,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error('❌ getPosts Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single post by ID
// @route   GET /api/community/posts/:postId
// @access  Public / Optional Auth
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isObjectIdString(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID format' });
    }

    const post = await Post.findById(postId);
    if (!post || !post.is_active) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const requesterId = req.user?.userId ? req.user.userId.toString() : null;
    let isLiked = false;

    if (requesterId) {
      const existingLike = await PostLike.findOne({
        post: post._id,
        $or: [
          ...(isObjectIdString(requesterId) ? [{ user: new mongoose.Types.ObjectId(requesterId) }] : []),
          { user_id: requesterId },
        ],
      });
      isLiked = !!existingLike;
    }

    const postObj = post.toObject();
    const postUserIdStr = post.user_id ? post.user_id.toString() : (post.user ? post.user.toString() : '');

    return res.status(200).json({
      success: true,
      post: {
        ...postObj,
        post_id: post._id.toString(),
        is_liked: isLiked,
        is_owner: requesterId ? (postUserIdStr === requesterId || (post.user && post.user.toString() === requesterId)) : false,
      },
    });
  } catch (error) {
    console.error('❌ getPostById Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new community post
// @route   POST /api/community/posts
// @access  Private (Authenticated User)
exports.createPost = async (req, res) => {
  try {
    const { caption, media_url, media_type = 'image', sport_category = 'General', location = '' } = req.body;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({ success: false, message: 'Authentication required to create a post' });
    }

    if (!caption || caption.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Post caption is required' });
    }

    if (!media_url || media_url.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Post media URL is required' });
    }

    // Lookup user info to attach to post
    let userDoc = null;
    if (isObjectIdString(requesterId.toString())) {
      userDoc = await User.findById(requesterId);
    }
    if (!userDoc) {
      userDoc = await User.findOne({ _id: requesterId });
    }

    const userName = userDoc?.fullName || userDoc?.name || req.user.name || 'SportVerse Athlete';
    const userAvatar = userDoc?.profileImage || req.user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    const userRole = userDoc?.role || req.user.role || 'Athlete';
    const userObjId = userDoc?._id || (isObjectIdString(requesterId.toString()) ? new mongoose.Types.ObjectId(requesterId) : new mongoose.Types.ObjectId());

    const newPost = await Post.create({
      user: userObjId,
      user_id: requesterId.toString(),
      user_name: userName,
      user_avatar: userAvatar,
      user_role: userRole,
      caption: caption.trim(),
      media_url: media_url.trim(),
      media_type: media_type === 'video' ? 'video' : 'image',
      sport_category: sport_category.trim() || 'General',
      location: location.trim(),
      like_count: 0,
      comment_count: 0,
      is_active: true,
    });

    const postObj = newPost.toObject();
    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        ...postObj,
        post_id: newPost._id.toString(),
        is_liked: false,
        is_owner: true,
      },
    });
  } catch (error) {
    console.error('❌ createPost Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an existing post (Caption, sport category, location)
// @route   PUT /api/community/posts/:postId
// @access  Private (Owner or Admin)
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption, sport_category, location, media_url } = req.body;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (!isObjectIdString(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post || !post.is_active) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const postOwnerId = post.user_id ? post.user_id.toString() : (post.user ? post.user.toString() : '');
    if (requesterRole !== 'Admin' && postOwnerId !== requesterId && post.user?.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only edit your own posts' });
    }

    if (caption !== undefined) post.caption = caption.trim();
    if (sport_category !== undefined) post.sport_category = sport_category.trim();
    if (location !== undefined) post.location = location.trim();
    if (media_url !== undefined && media_url.trim().length > 0) post.media_url = media_url.trim();

    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: {
        ...post.toObject(),
        post_id: post._id.toString(),
        is_owner: true,
      },
    });
  } catch (error) {
    console.error('❌ updatePost Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a post (and cascade delete its likes & comments)
// @route   DELETE /api/community/posts/:postId
// @access  Private (Owner or Admin)
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (!isObjectIdString(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const postOwnerId = post.user_id ? post.user_id.toString() : (post.user ? post.user.toString() : '');
    if (requesterRole !== 'Admin' && postOwnerId !== requesterId && post.user?.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own posts' });
    }

    // Cascade delete likes & comments
    await Promise.all([
      Post.findByIdAndDelete(postId),
      PostLike.deleteMany({ post: post._id }),
      PostComment.deleteMany({ post: post._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      post_id: postId,
    });
  } catch (error) {
    console.error('❌ deletePost Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Like / Unlike on a post (Atomic, strictly 1 like per user)
// @route   POST /api/community/posts/:postId/like
// @access  Private (Authenticated User)
exports.toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({ success: false, message: 'Authentication required to like posts' });
    }

    if (!isObjectIdString(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post || !post.is_active) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userObjId = isObjectIdString(requesterId.toString())
      ? new mongoose.Types.ObjectId(requesterId.toString())
      : new mongoose.Types.ObjectId();

    // Check if like already exists
    const existingLike = await PostLike.findOne({
      post: post._id,
      $or: [
        ...(isObjectIdString(requesterId.toString()) ? [{ user: userObjId }] : []),
        { user_id: requesterId.toString() },
      ],
    });

    if (existingLike) {
      // UNLIKE
      await PostLike.findByIdAndDelete(existingLike._id);
      const updatedPost = await Post.findByIdAndUpdate(
        post._id,
        { $inc: { like_count: -1 } },
        { new: true }
      );
      const newCount = Math.max(0, updatedPost?.like_count || 0);
      if (updatedPost && updatedPost.like_count < 0) {
        await Post.findByIdAndUpdate(post._id, { like_count: 0 });
      }

      return res.status(200).json({
        success: true,
        liked: false,
        like_count: newCount,
        message: 'Post unliked',
      });
    } else {
      // LIKE
      try {
        await PostLike.create({
          post: post._id,
          user: userObjId,
          user_id: requesterId.toString(),
        });
      } catch (err) {
        // Handle duplicate key error gracefully
        if (err.code === 11000) {
          return res.status(200).json({
            success: true,
            liked: true,
            like_count: post.like_count,
            message: 'Already liked',
          });
        }
        throw err;
      }

      const updatedPost = await Post.findByIdAndUpdate(
        post._id,
        { $inc: { like_count: 1 } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        liked: true,
        like_count: updatedPost?.like_count || 1,
        message: 'Post liked',
      });
    }
  } catch (error) {
    console.error('❌ toggleLikePost Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unlike a post (DELETE route alternative)
// @route   DELETE /api/community/posts/:postId/like
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!isObjectIdString(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingLike = await PostLike.findOneAndDelete({
      post: post._id,
      $or: [
        ...(isObjectIdString(requesterId.toString()) ? [{ user: new mongoose.Types.ObjectId(requesterId.toString()) }] : []),
        { user_id: requesterId.toString() },
      ],
    });

    let newCount = post.like_count;
    if (existingLike) {
      const updated = await Post.findByIdAndUpdate(post._id, { $inc: { like_count: -1 } }, { new: true });
      newCount = Math.max(0, updated?.like_count || 0);
    }

    return res.status(200).json({
      success: true,
      liked: false,
      like_count: newCount,
      message: 'Post unliked successfully',
    });
  } catch (error) {
    console.error('❌ unlikePost Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comments for a specific post
// @route   GET /api/community/posts/:postId/comments
// @access  Public / Optional Auth
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isObjectIdString(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const comments = await PostComment.find({ post: postId }).sort({ created_at: 1 });
    const requesterId = req.user?.userId ? req.user.userId.toString() : null;

    const formattedComments = comments.map((c) => {
      const commentObj = c.toObject();
      const commentUserIdStr = c.user_id ? c.user_id.toString() : (c.user ? c.user.toString() : '');
      return {
        ...commentObj,
        comment_id: c._id.toString(),
        post_id: postId,
        is_owner: requesterId ? (commentUserIdStr === requesterId || (c.user && c.user.toString() === requesterId)) : false,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedComments.length,
      comments: formattedComments,
    });
  } catch (error) {
    console.error('❌ getComments Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/community/posts/:postId/comments
// @access  Private (Authenticated User)
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment_text } = req.body;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({ success: false, message: 'Authentication required to post comments' });
    }

    if (!isObjectIdString(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
    }

    const post = await Post.findById(postId);
    if (!post || !post.is_active) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let userDoc = null;
    if (isObjectIdString(requesterId.toString())) {
      userDoc = await User.findById(requesterId);
    }
    if (!userDoc) {
      userDoc = await User.findOne({ _id: requesterId });
    }

    const userName = userDoc?.fullName || userDoc?.name || req.user.name || 'Athlete';
    const userAvatar = userDoc?.profileImage || req.user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    const userObjId = userDoc?._id || (isObjectIdString(requesterId.toString()) ? new mongoose.Types.ObjectId(requesterId) : new mongoose.Types.ObjectId());

    const newComment = await PostComment.create({
      post: post._id,
      user: userObjId,
      user_id: requesterId.toString(),
      user_name: userName,
      user_avatar: userAvatar,
      comment_text: comment_text.trim(),
    });

    // Increment post comment_count
    await Post.findByIdAndUpdate(post._id, { $inc: { comment_count: 1 } });

    const commentObj = newComment.toObject();
    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        ...commentObj,
        comment_id: newComment._id.toString(),
        post_id: postId,
        is_owner: true,
      },
    });
  } catch (error) {
    console.error('❌ addComment Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/community/comments/:commentId
// @access  Private (Comment Owner, Post Owner, or Admin)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (!isObjectIdString(commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await PostComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const commentAuthorId = comment.user_id ? comment.user_id.toString() : (comment.user ? comment.user.toString() : '');
    const isCommentAuthor = requesterId && (commentAuthorId === requesterId || comment.user?.toString() === requesterId);

    // Also check if requester is the post owner
    const post = await Post.findById(comment.post);
    const postOwnerId = post?.user_id ? post.user_id.toString() : (post?.user ? post.user.toString() : '');
    const isPostOwner = requesterId && (postOwnerId === requesterId || post?.user?.toString() === requesterId);

    if (requesterRole !== 'Admin' && !isCommentAuthor && !isPostOwner) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own comments' });
    }

    await PostComment.findByIdAndDelete(commentId);

    // Decrement post comment_count
    if (post) {
      const updatedPost = await Post.findByIdAndUpdate(post._id, { $inc: { comment_count: -1 } }, { new: true });
      if (updatedPost && updatedPost.comment_count < 0) {
        await Post.findByIdAndUpdate(post._id, { comment_count: 0 });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      comment_id: commentId,
    });
  } catch (error) {
    console.error('❌ deleteComment Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's community profile & their uploaded posts
// @route   GET /api/community/users/:userId
// @access  Public / Optional Auth
exports.getUserCommunityProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    let targetUserId = userId;

    if (userId === 'me') {
      if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      targetUserId = req.user.userId.toString();
    }

    let userDoc = null;
    if (isObjectIdString(targetUserId)) {
      userDoc = await User.findById(targetUserId).select('-password -stationPassword');
    }
    if (!userDoc) {
      userDoc = await User.findOne({ _id: targetUserId }).select('-password -stationPassword');
    }

    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userPosts = await Post.find({
      $or: [
        { user: userDoc._id },
        { user_id: targetUserId },
        { user_id: userDoc._id.toString() },
      ],
      is_active: true,
    }).sort({ created_at: -1 });

    const totalLikes = userPosts.reduce((sum, p) => sum + (p.like_count || 0), 0);
    const requesterId = req.user?.userId ? req.user.userId.toString() : null;
    const isSelf = requesterId ? (userDoc._id.toString() === requesterId || targetUserId === requesterId) : false;

    return res.status(200).json({
      success: true,
      user: {
        user_id: userDoc._id.toString(),
        fullName: userDoc.fullName,
        email: userDoc.email,
        role: userDoc.role,
        bio: userDoc.bio || 'Sports enthusiast & athlete on SportVerse AI',
        favoriteSport: userDoc.favoriteSport || 'Football',
        location: userDoc.location || 'Calicut, Kerala',
        profileImage: userDoc.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        totalPosts: userPosts.length,
        totalLikesReceived: totalLikes,
        isSelf,
      },
      posts: userPosts.map((p) => ({
        ...p.toObject(),
        post_id: p._id.toString(),
        is_owner: isSelf,
      })),
    });
  } catch (error) {
    console.error('❌ getUserCommunityProfile Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update community user profile (bio, favorite sport, profile image, location)
// @route   PUT /api/community/profile
// @access  Private
exports.updateCommunityProfile = async (req, res) => {
  try {
    const requesterId = req.user?.userId;
    const { bio, favoriteSport, location, profileImage, fullName } = req.body;

    if (!requesterId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let userDoc = null;
    if (isObjectIdString(requesterId.toString())) {
      userDoc = await User.findById(requesterId);
    }
    if (!userDoc) {
      userDoc = await User.findOne({ _id: requesterId });
    }

    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (bio !== undefined) userDoc.bio = bio.trim();
    if (favoriteSport !== undefined) userDoc.favoriteSport = favoriteSport.trim();
    if (location !== undefined) userDoc.location = location.trim();
    if (profileImage !== undefined && profileImage.trim().length > 0) userDoc.profileImage = profileImage.trim();
    if (fullName !== undefined && fullName.trim().length > 0) userDoc.fullName = fullName.trim();

    await userDoc.save();

    // Also update existing posts with new name/avatar if changed
    if (profileImage || fullName) {
      await Post.updateMany(
        { $or: [{ user: userDoc._id }, { user_id: requesterId.toString() }] },
        {
          $set: {
            ...(fullName ? { user_name: userDoc.fullName } : {}),
            ...(profileImage ? { user_avatar: userDoc.profileImage } : {}),
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        user_id: userDoc._id.toString(),
        fullName: userDoc.fullName,
        email: userDoc.email,
        role: userDoc.role,
        bio: userDoc.bio,
        favoriteSport: userDoc.favoriteSport,
        location: userDoc.location,
        profileImage: userDoc.profileImage,
      },
    });
  } catch (error) {
    console.error('❌ updateCommunityProfile Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed initial realistic sports posts if database is empty
exports.seedPostsIfEmpty = async () => {
  try {
    const count = await Post.countDocuments({});
    if (count > 0) {
      return;
    }

    console.log('🌱 Seeding initial SportVerse Community Posts...');

    // Find or fallback to admin/athlete user
    let defaultUser = await User.findOne({ role: 'User' }) || await User.findOne({});
    const userId = defaultUser ? defaultUser._id : new mongoose.Types.ObjectId();
    const userIdStr = userId.toString();

    const samplePosts = [
      {
        user: userId,
        user_id: userIdStr,
        user_name: 'Rahul Sharma ⚡',
        user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        user_role: 'Football Striker',
        caption: 'Incredible 7v7 night under the floodlights at Kickoff Arena! Scored a hat-trick in the dying minutes ⚽🔥 Who is up for a rematch this weekend? #Football #NightMatch #SportVerse',
        media_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        sport_category: 'Football',
        location: 'Kickoff Arena, Malaparamba',
        like_count: 24,
        comment_count: 5,
        is_active: true,
      },
      {
        user: userId,
        user_id: userIdStr,
        user_name: 'Sneha Patel 🏸',
        user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        user_role: 'Badminton Pro',
        caption: 'New racket tested and ready for the state doubles qualifier! The court traction here at Smash Academy is next level 🏸💪 #Badminton #TrainingDay #GameOn',
        media_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        sport_category: 'Badminton',
        location: 'Smash Court, Calicut',
        like_count: 42,
        comment_count: 8,
        is_active: true,
      },
      {
        user: userId,
        user_id: userIdStr,
        user_name: 'Kozhikode Hoopers 🏀',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        user_role: 'Basketball Club',
        caption: 'Sunset pickup hoops session! 3v3 half-court championship recap. Energy was off the charts tonight! 🏀✨ #Hoops #Streetball #CalicutSports',
        media_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        sport_category: 'Basketball',
        location: 'Hoopster Court, Medical College Road',
        like_count: 31,
        comment_count: 3,
        is_active: true,
      },
      {
        user: userId,
        user_id: userIdStr,
        user_name: 'Vikram Singh 🏏',
        user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        user_role: 'Cricket All-Rounder',
        caption: 'Box Cricket tournament champions! 🏆 Final ball six to seal the victory. Huge shoutout to my squad! #Cricket #BoxCricket #Championship #Victory',
        media_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        sport_category: 'Cricket',
        location: 'Malabar Box Cricket Arena',
        like_count: 56,
        comment_count: 12,
        is_active: true,
      },
      {
        user: userId,
        user_id: userIdStr,
        user_name: 'Ananya Roy 🏃‍♀️',
        user_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        user_role: 'Marathon Runner',
        caption: '10K morning run completed around the beach track! 🌅 Great weather and personal best time of 44:20. Stay active and keep pushing! #Running #Fitness #MorningRun #Health',
        media_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
        media_type: 'image',
        sport_category: 'Running',
        location: 'Calicut Beach Track',
        like_count: 39,
        comment_count: 6,
        is_active: true,
      },
    ];

    const insertedPosts = await Post.insertMany(samplePosts);

    // Add some sample comments for the first post
    if (insertedPosts.length > 0) {
      await PostComment.insertMany([
        {
          post: insertedPosts[0]._id,
          user: userId,
          user_id: userIdStr,
          user_name: 'Arun V.',
          user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          comment_text: 'What a game that was! That bicycle kick in the 2nd half was unreal ⚽👏',
        },
        {
          post: insertedPosts[0]._id,
          user: userId,
          user_id: userIdStr,
          user_name: 'Deepak K.',
          user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          comment_text: 'Count me in for the Saturday rematch! Let us book the 8 PM slot.',
        },
      ]);
    }

    console.log(`✅ Seeded ${insertedPosts.length} Community Posts successfully.`);
  } catch (err) {
    console.error('❌ seedPostsIfEmpty Error:', err);
  }
};
