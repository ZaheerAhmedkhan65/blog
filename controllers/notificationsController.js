//controllers/notificationsController.js
const NotificationService = require('../services/notification.service');

const notificationsController = {
    // Get all notifications
    getNotifications: async (req, res) => {
        try {
            const {
                limit = 20,
                offset = 0,
                unreadOnly = false,
                markAsRead = false
            } = req.query;

            const result = await NotificationService.getUserNotifications(req.user.userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                unreadOnly: unreadOnly === 'true',
                markAsRead: markAsRead === 'true'
            });

            res.json({
                success: true,
                data: {
                    notifications: result.notifications,
                    pagination: {
                        total: result.total,
                        unreadCount: result.unreadCount,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: result.hasMore
                    }
                }
            });
        } catch (error) {
            console.error('Error getting notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get notifications'
            });
        }
    },

    // Mark notification as read
    markNotificationAsRead: async (req, res) => {
        try {
            const notificationId = req.params.id;

            const result = await NotificationService.markAsRead(notificationId, req.user.userId);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);

            let statusCode = 500;
            let errorMessage = 'Failed to mark notification as read';

            if (error.message.includes('not found')) {
                statusCode = 404;
                errorMessage = error.message;
            } else if (error.message.includes('authorized')) {
                statusCode = 403;
                errorMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    },

    // Mark all notifications as read
    markAllAsRead: async (req, res) => {
        try {
            const result = await NotificationService.markAllAsRead(req.user.userId);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark all notifications as read'
            });
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const notificationId = req.params.id;

            const result = await NotificationService.deleteNotification(notificationId, req.user.userId);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error deleting notification:', error);

            let statusCode = 500;
            let errorMessage = 'Failed to delete notification';

            if (error.message.includes('not found')) {
                statusCode = 404;
                errorMessage = error.message;
            } else if (error.message.includes('authorized')) {
                statusCode = 403;
                errorMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    },

    // Clear all notifications
    clearAllNotifications: async (req, res) => {
        try {
            const result = await NotificationService.clearAllNotifications(req.user.userId);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error clearing all notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear all notifications'
            });
        }
    },

    // Get notification statistics
    getNotificationStats: async (req, res) => {
        try {
            const stats = await NotificationService.getNotificationStats(req.user.userId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting notification stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get notification statistics'
            });
        }
    }
};

module.exports = notificationsController;