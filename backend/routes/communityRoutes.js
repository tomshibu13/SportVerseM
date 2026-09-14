const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Post Feed & Single Post Routes
router.get('/posts', optionalAuth, communityController.getPosts);
router.get('/posts/:postId', optionalAuth, communityController.getPostById);
router.post('/posts', protect, communityController.createPost);
router.put('/posts/:postId', protect, communityController.updatePost);
router.delete('/posts/:postId', protect, communityController.deletePost);

// Post Like / Unlike Routes
router.post('/posts/:postId/like', protect, communityController.toggleLikePost);
router.delete('/posts/:postId/like', protect, communityController.unlikePost);

// Comments Routes
router.get('/posts/:postId/comments', optionalAuth, communityController.getComments);
router.post('/posts/:postId/comments', protect, communityController.addComment);
router.delete('/comments/:commentId', protect, communityController.deleteComment);

// Community User Profile Routes
router.get('/users/:userId', optionalAuth, communityController.getUserCommunityProfile);
router.put('/profile', protect, communityController.updateCommunityProfile);

module.exports = router;
