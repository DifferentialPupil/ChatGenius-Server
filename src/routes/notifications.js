/**
 * Notification routes
 */
const express = require('express');
const router = express.Router();
const { 
    getUserNotifications, 
    getUnreadNotificationCount,
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} = require('../controllers/notifications');

// Get user notifications with optional filtering
router.get('/', getUserNotifications);

// Get unread notification count
router.get('/count', getUnreadNotificationCount);

// Mark a notification as read
router.patch('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllNotificationsAsRead);

module.exports = router; 