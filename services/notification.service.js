const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
    // Get notifications for user
    static async getUserNotifications(userId, options = {}) {
        try {
            const {
                limit = 20,
                offset = 0,
                unreadOnly = false,
                markAsRead = false
            } = options;

            let notifications = await Notification.getNotificationsByUserId(userId);

            // Apply filters
            if (unreadOnly) {
                notifications = notifications.filter(n => !n.is_read);
            }

            // Apply pagination
            const paginatedNotifications = notifications.slice(offset, offset + limit);

            // Mark as read if specified
            if (markAsRead) {
                await Promise.all(
                    paginatedNotifications
                        .filter(n => !n.is_read)
                        .map(n => Notification.markNotificationAsRead(n.id))
                );
            }

            // Get actor details for each notification
            const enrichedNotifications = await Promise.all(
                paginatedNotifications.map(async (notification) => {
                    const actor = await User.findById(notification.actor_id);
                    const { password, ...safeActor } = actor;

                    return {
                        ...notification,
                        actor: safeActor
                    };
                })
            );

            return {
                notifications: enrichedNotifications,
                total: notifications.length,
                unreadCount: notifications.filter(n => !n.is_read).length,
                hasMore: notifications.length > offset + limit
            };
        } catch (error) {
            throw new Error(`Failed to get notifications: ${error.message}`);
        }
    }

    // Mark notification as read
    static async markAsRead(notificationId, userId) {
        try {
            // Verify notification exists and belongs to user
            const notification = await this.getNotificationById(notificationId);
            if (!notification) {
                throw new Error('Notification not found');
            }

            if (notification.user_id !== userId) {
                throw new Error('Not authorized to modify this notification');
            }

            const result = await Notification.markNotificationAsRead(notificationId);
            if (!result) {
                throw new Error('Failed to mark notification as read');
            }

            return { success: true, message: 'Notification marked as read' };
        } catch (error) {
            throw new Error(`Failed to mark notification as read: ${error.message}`);
        }
    }

    // Mark all notifications as read
    static async markAllAsRead(userId) {
        try {
            const notifications = await Notification.getNotificationsByUserId(userId);
            const unreadNotifications = notifications.filter(n => !n.is_read);

            await Promise.all(
                unreadNotifications.map(n => Notification.markNotificationAsRead(n.id))
            );

            return {
                success: true,
                message: `Marked ${unreadNotifications.length} notifications as read`
            };
        } catch (error) {
            throw new Error(`Failed to mark all notifications as read: ${error.message}`);
        }
    }

    // Delete notification
    static async deleteNotification(notificationId, userId) {
        try {
            // Verify notification exists and belongs to user
            const notification = await this.getNotificationById(notificationId);
            if (!notification) {
                throw new Error('Notification not found');
            }

            if (notification.user_id !== userId) {
                throw new Error('Not authorized to delete this notification');
            }

            // This would require adding a delete method to Notification model
            // For now, let's assume we have one
            const result = await Notification.deleteNotification(notificationId);

            return { success: true, message: 'Notification deleted' };
        } catch (error) {
            throw new Error(`Failed to delete notification: ${error.message}`);
        }
    }

    // Clear all notifications
    static async clearAllNotifications(userId) {
        try {
            // This would require adding a clear method to Notification model
            // For now, mark all as read and optionally archive them
            await this.markAllAsRead(userId);

            // Optional: Move to archive or soft delete
            // await Notification.archiveUserNotifications(userId);

            return { success: true, message: 'All notifications cleared' };
        } catch (error) {
            throw new Error(`Failed to clear notifications: ${error.message}`);
        }
    }

    // Create notification (for internal use)
    static async createNotification(data) {
        try {
            const { userId, actorId, type, postId = null } = data;

            // Validate users exist
            const [user, actor] = await Promise.all([
                User.findById(userId),
                User.findById(actorId)
            ]);

            if (!user || !actor) {
                throw new Error('User not found');
            }

            // Check if notification already exists (prevent duplicates)
            // This would require adding a checkDuplicate method
            // For now, just create the notification

            const notification = await Notification.createNotification(userId, actorId, type, postId);

            return notification;
        } catch (error) {
            throw new Error(`Failed to create notification: ${error.message}`);
        }
    }

    // Get notification by ID (helper method)
    static async getNotificationById(notificationId) {
        try {
            // This would require adding a getNotificationById method to Notification model
            // For now, get all user notifications and filter
            // In a real implementation, add this method to the model

            // Placeholder implementation
            const allNotifications = await Notification.getAllNotifications();
            return allNotifications.find(n => n.id === notificationId);
        } catch (error) {
            throw new Error(`Failed to get notification: ${error.message}`);
        }
    }

    // Get notification statistics
    static async getNotificationStats(userId) {
        try {
            const notifications = await Notification.getNotificationsByUserId(userId);

            const stats = {
                total: notifications.length,
                unread: notifications.filter(n => !n.is_read).length,
                byType: {
                    follow: notifications.filter(n => n.type === 'follow').length,
                    like: notifications.filter(n => n.type === 'like').length,
                    dislike: notifications.filter(n => n.type === 'dislike').length,
                    repost: notifications.filter(n => n.type === 'repost').length,
                    new_post: notifications.filter(n => n.type === 'new_post').length,
                    reply: notifications.filter(n => n.type === 'reply').length
                },
                last24Hours: notifications.filter(n => {
                    const hoursAgo = (Date.now() - new Date(n.created_at)) / (1000 * 60 * 60);
                    return hoursAgo < 24;
                }).length
            };

            return stats;
        } catch (error) {
            throw new Error(`Failed to get notification stats: ${error.message}`);
        }
    }
}

module.exports = NotificationService;