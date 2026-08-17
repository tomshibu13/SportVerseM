const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// @desc    Get notifications for a user
// @route   GET /api/notifications/user/:userId or GET /api/notifications
// @access  Public / User / Admin
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    let query = {};
    if (userId && userId !== 'all') {
      query = {
        $or: [
          { user_id: userId },
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ user_id: new mongoose.Types.ObjectId(userId) }] : [])
        ]
      };
    }

    const notifications = await Notification.find(query).sort({ created_at: -1 }).limit(50);
    return res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    console.error('❌ getUserNotifications error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Public / User
exports.markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    let notif = null;
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      notif = await Notification.findOne({ notification_id: numId });
    }
    if (!notif && mongoose.Types.ObjectId.isValid(id)) {
      notif = await Notification.findById(id);
    }

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notif.is_read = true;
    await notif.save();

    return res.status(200).json({ success: true, message: 'Notification marked as read', notification: notif });
  } catch (error) {
    console.error('❌ markAsRead error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Helper to create an in-app notification
exports.createInAppNotification = async ({ userId, title, message, notificationType = 'Approval', data = {} }) => {
  try {
    const notif = new Notification({
      notification_id: Date.now() + Math.floor(Math.random() * 1000),
      user_id: userId,
      title,
      message,
      notification_type: notificationType,
      data: data || {},
      is_read: false,
      created_at: new Date()
    });
    await notif.save();
    console.log(`🔔 In-app notification created for user ${userId}: "${title}"`);
    return notif;
  } catch (err) {
    console.error('⚠️ Failed to save in-app notification:', err.message);
    return null;
  }
};
