const { UserNotification, NotificationPreference, Message, DirectMessage, Channel, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get user notifications with optional filtering
 * @route GET /api/notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with notifications or error
 */
const getUserNotifications = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { unread, page = 1, limit = 20, type } = req.query;
        
        // Build query conditions
        const whereConditions = { userId };
        
        // Add filter for unread notifications if specified
        if (unread === 'true') {
            whereConditions.isRead = false;
        } else if (unread === 'false') {
            whereConditions.isRead = true;
        }
        
        // Add filter for notification type if specified
        if (type) {
            whereConditions.type = type;
        }
        
        // Calculate pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get notifications with pagination
        const notifications = await UserNotification.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Message,
                    as: 'message',
                    attributes: ['messageId', 'content', 'created_at'],
                    required: false
                },
                {
                    model: DirectMessage,
                    as: 'directMessage',
                    attributes: ['directMessageId', 'content', 'created_at'],
                    required: false
                },
                {
                    model: Channel,
                    as: 'channel',
                    attributes: ['channelId', 'name'],
                    required: false
                }
            ]
        });
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(notifications.count / parseInt(limit));
        
        res.json({
            notifications: notifications.rows,
            pagination: {
                total: notifications.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ error: 'An error occurred while fetching notifications' });
    }
};

/**
 * Get unread notification count
 * @route GET /api/notifications/count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with count or error
 */
const getUnreadNotificationCount = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { type } = req.query;
        
        // Build query conditions
        const whereConditions = { 
            userId, 
            isRead: false 
        };
        
        // Add filter for notification type if specified
        if (type) {
            whereConditions.type = type;
        }
        
        // Get count of unread notifications
        const count = await UserNotification.count({
            where: whereConditions
        });
        
        res.json({
            count,
            type: type || 'all'
        });
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        res.status(500).json({ error: 'An error occurred while fetching notification count' });
    }
};

/**
 * Mark a notification as read
 * @route PATCH /api/notifications/:notificationId/read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with success or error
 */
const markNotificationAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.user;
        
        // Find notification and ensure it belongs to the current user
        const notification = await UserNotification.findOne({
            where: {
                notificationId,
                userId
            }
        });
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        // Update notification to mark as read
        await notification.update({ isRead: true });
        
        // Emit socket event to notify clients
        // SocketService.emitToUser(userId, 'notification_updated', { 
        //     notificationId,
        //     isRead: true 
        // });
        
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'An error occurred while updating notification' });
    }
};

/**
 * Mark all user notifications as read
 * @route PATCH /api/notifications/read-all
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with success or error
 */
const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { type } = req.query;
        
        // Build conditions for notifications to mark as read
        const whereConditions = {
            userId,
            isRead: false
        };
        
        // Add filter for notification type if specified
        if (type) {
            whereConditions.type = type;
        }
        
        // Update all matching unread notifications for the user
        const result = await UserNotification.update(
            { isRead: true },
            { where: whereConditions }
        );
        
        const updatedCount = result[0]; // Number of updated rows
        
        // Emit socket event to notify clients
        // SocketService.emitToUser(userId, 'all_notifications_read', { 
        //     count: updatedCount 
        // });
        
        res.json({
            success: true,
            message: `${updatedCount} notifications marked as read`,
            type: type || 'all'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'An error occurred while updating notifications' });
    }
};

/**
 * Get user notification preferences
 * @route GET /api/users/me/notification-preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with preferences or error
 */
const getNotificationPreferences = async (req, res, next) => {
    try {
        const { userId } = req.user;
        
        // Find or create preferences for the user
        let preferences = await NotificationPreference.findOne({
            where: { userId }
        });
        
        // If preferences don't exist, create default preferences
        if (!preferences) {
            preferences = await NotificationPreference.create({
                userId,
                notifyOnDirectMessage: true,
                notifyOnChannelMessage: true,
                notifyOnMention: true,
                soundEnabled: true,
                desktopNotificationsEnabled: true,
                mobileNotificationsEnabled: true,
                quietHours: false,
                quietHoursStart: '22:00',
                quietHoursEnd: '08:00'
            });
        }
        
        res.json(preferences);
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'An error occurred while fetching notification preferences' });
    }
};

/**
 * Update user notification preferences
 * @route PATCH /api/users/me/notification-preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with updated preferences or error
 */
const updateNotificationPreferences = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const {
            notifyOnDirectMessage,
            notifyOnChannelMessage,
            notifyOnMention,
            soundEnabled,
            desktopNotificationsEnabled,
            mobileNotificationsEnabled,
            quietHours,
            quietHoursStart,
            quietHoursEnd
        } = req.body;
        
        // Build update object with only provided fields
        const updateData = {};
        
        if (notifyOnDirectMessage !== undefined) {
            updateData.notifyOnDirectMessage = notifyOnDirectMessage === true || notifyOnDirectMessage === 'true';
        }
        
        if (notifyOnChannelMessage !== undefined) {
            updateData.notifyOnChannelMessage = notifyOnChannelMessage === true || notifyOnChannelMessage === 'true';
        }
        
        if (notifyOnMention !== undefined) {
            updateData.notifyOnMention = notifyOnMention === true || notifyOnMention === 'true';
        }
        
        if (soundEnabled !== undefined) {
            updateData.soundEnabled = soundEnabled === true || soundEnabled === 'true';
        }
        
        if (desktopNotificationsEnabled !== undefined) {
            updateData.desktopNotificationsEnabled = desktopNotificationsEnabled === true || desktopNotificationsEnabled === 'true';
        }
        
        if (mobileNotificationsEnabled !== undefined) {
            updateData.mobileNotificationsEnabled = mobileNotificationsEnabled === true || mobileNotificationsEnabled === 'true';
        }
        
        if (quietHours !== undefined) {
            updateData.quietHours = quietHours === true || quietHours === 'true';
        }
        
        if (quietHoursStart !== undefined) {
            updateData.quietHoursStart = quietHoursStart;
        }
        
        if (quietHoursEnd !== undefined) {
            updateData.quietHoursEnd = quietHoursEnd;
        }
        
        // Find or create preferences
        let preferences = await NotificationPreference.findOne({
            where: { userId }
        });
        
        if (!preferences) {
            // Create with defaults plus any specified changes
            preferences = await NotificationPreference.create({
                userId,
                notifyOnDirectMessage: true,
                notifyOnChannelMessage: true,
                notifyOnMention: true,
                soundEnabled: true,
                desktopNotificationsEnabled: true,
                mobileNotificationsEnabled: true,
                quietHours: false,
                quietHoursStart: '22:00',
                quietHoursEnd: '08:00',
                ...updateData
            });
        } else {
            // Update existing preferences
            await preferences.update(updateData);
            // Refresh the data
            preferences = await NotificationPreference.findOne({
                where: { userId }
            });
        }
        
        // Emit socket event to notify clients of preference changes
        // SocketService.emitToUser(userId, 'notification_preferences_updated', preferences);
        
        res.json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'An error occurred while updating notification preferences' });
    }
};

/**
 * Create a new notification for a user
 * @param {String} userId - User ID to create notification for
 * @param {String} type - Type of notification
 * @param {String} content - Content of notification
 * @param {Object} refs - References (messageId, directMessageId, channelId)
 * @returns {Object} Created notification
 */
const createNotification = async (userId, type, content, refs = {}) => {
    try {
        const { messageId, directMessageId, channelId } = refs;
        
        // Create the notification
        const notification = await UserNotification.create({
            userId,
            type,
            content,
            messageId,
            directMessageId,
            channelId,
            isRead: false
        });
        
        // Check if user has specific notification preferences
        const preferences = await NotificationPreference.findOne({
            where: { userId }
        });
        
        // Only emit notification event if user preferences allow it
        let shouldNotify = true;
        
        if (preferences) {
            if (type === 'direct_message' && !preferences.notifyOnDirectMessage) {
                shouldNotify = false;
            } else if (type === 'channel_message' && !preferences.notifyOnChannelMessage) {
                shouldNotify = false;
            } else if (type === 'mention' && !preferences.notifyOnMention) {
                shouldNotify = false;
            }
            
            // Check quiet hours if enabled
            if (shouldNotify && preferences.quietHours) {
                const currentTime = new Date();
                const currentHour = currentTime.getHours();
                const currentMinute = currentTime.getMinutes();
                
                const startParts = preferences.quietHoursStart.split(':');
                const endParts = preferences.quietHoursEnd.split(':');
                
                const startHour = parseInt(startParts[0]);
                const startMinute = parseInt(startParts[1]);
                const endHour = parseInt(endParts[0]);
                const endMinute = parseInt(endParts[1]);
                
                // Convert current time to minutes for comparison
                const currentTimeInMinutes = currentHour * 60 + currentMinute;
                const startTimeInMinutes = startHour * 60 + startMinute;
                const endTimeInMinutes = endHour * 60 + endMinute;
                
                // Check if current time is within quiet hours
                if (startTimeInMinutes <= endTimeInMinutes) {
                    // Simple case: Start time is before end time (e.g., 22:00 to 08:00)
                    if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
                        shouldNotify = false;
                    }
                } else {
                    // Complex case: Start time is after end time (crosses midnight, e.g., 22:00 to 08:00)
                    if (currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes) {
                        shouldNotify = false;
                    }
                }
            }
        }
        
        // Emit socket event to notify the user
        // if (shouldNotify) {
        //     SocketService.emitToUser(userId, 'new_notification', {
        //         notification,
        //         sound: preferences?.soundEnabled || true,
        //         desktop: preferences?.desktopNotificationsEnabled || true
        //     });
        // }
        
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

module.exports = {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getNotificationPreferences,
    updateNotificationPreferences,
    createNotification
}; 