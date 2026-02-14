const User = require('../models/User');
const Post = require('../models/Post');
const Follower = require('../models/Follower');
const Notification = require('../models/Notification');

class UserService {
    // Get user profile
    static async getProfile(username, currentUserId = null) {
        try {
            const user = await User.findUser(username);
            if (!user) {
                throw new Error('User not found');
            }

            // Get counts
            const [postsCount, followersCount, followingCount] = await Promise.all([
                Post.getPostsCountByUser(user.id),
                Follower.getFollowersCountByUserId(user.id),
                Follower.getFollowingsCountByUserId(user.id)
            ]);

            // Check if current user is following this user
            let isFollowing = false;
            if (currentUserId && currentUserId !== user.id) {
                const followStatus = await Follower.getFollowersByUserIdAndFollowerId(currentUserId, user.id);
                isFollowing = followStatus.length > 0;
            }

            // Remove sensitive information
            const { password, resetToken, resetTokenExpiry, ...safeUser } = user;

            return {
                ...safeUser,
                postsCount,
                followersCount,
                followingCount,
                isFollowing,
                isCurrentUser: currentUserId === user.id
            };
        } catch (error) {
            throw new Error(`Failed to get profile: ${error.message}`);
        }
    }

    // Update user profile
    static async updateProfile(userId, updateData) {
        try {
            // Check if username is being changed and if it's already taken
            if (updateData.name) {
                const existingUser = await User.findByUsername(updateData.name);
                if (existingUser && existingUser.id !== userId) {
                    throw new Error('Username already taken');
                }
            }

            // Check if email is being changed and if it's already taken
            if (updateData.email) {
                const existingEmail = await User.findByEmail(updateData.email);
                if (existingEmail && existingEmail.id !== userId) {
                    throw new Error('Email already registered');
                }
            }

            // Update user
            const updatedUser = await User.updateUser(userId, updateData);

            // Remove sensitive information
            const { password, resetToken, resetTokenExpiry, ...safeUser } = updatedUser;

            return safeUser;
        } catch (error) {
            throw new Error(`Failed to update profile: ${error.message}`);
        }
    }

    // Update avatar
    static async updateAvatar(userId, avatarData) {
        try {
            const { avatar, avatar_public_id } = avatarData;

            const updatedUser = await User.updateAvatar(userId, avatar, avatar_public_id);

            // Remove sensitive information
            const { password, resetToken, resetTokenExpiry, ...safeUser } = updatedUser;

            return safeUser;
        } catch (error) {
            throw new Error(`Failed to update avatar: ${error.message}`);
        }
    }

    // Get suggested users
    static async getSuggestedUsers(currentUserId, limit = 5) {
        try {
            const suggestedUsers = await User.getSuggestedUsers(currentUserId);

            // Add follow status for each user
            const usersWithStatus = await Promise.all(
                suggestedUsers.map(async (user) => {
                    const isFollowing = await this.checkFollowStatus(currentUserId, user.id);
                    const { password, ...safeUser } = user;

                    return {
                        ...safeUser,
                        isFollowing,
                        isCurrentUser: currentUserId === user.id
                    };
                })
            );

            return usersWithStatus;
        } catch (error) {
            throw new Error(`Failed to get suggested users: ${error.message}`);
        }
    }

    // Search users
    static async searchUsers(query, currentUserId, limit = 20, offset = 0) {
        try {
            // This would require adding a search method to User model
            // For now, let's implement a basic search
            const users = await User.searchUsers(query, limit, offset);

            // Add follow status for each user
            const usersWithStatus = await Promise.all(
                users.map(async (user) => {
                    const isFollowing = await this.checkFollowStatus(currentUserId, user.id);
                    const { password, ...safeUser } = user;

                    return {
                        ...safeUser,
                        isFollowing,
                        isCurrentUser: currentUserId === user.id
                    };
                })
            );

            return {
                users: usersWithStatus,
                total: users.length,
                hasMore: users.length === limit
            };
        } catch (error) {
            throw new Error(`Failed to search users: ${error.message}`);
        }
    }

    // Get user notifications
    static async getNotifications(userId, options = {}) {
        try {
            const { limit = 20, offset = 0, unreadOnly = false } = options;

            let notifications = await Notification.getNotificationsByUserId(userId);

            // Apply filters
            if (unreadOnly) {
                notifications = notifications.filter(n => !n.is_read);
            }

            // Apply pagination
            const paginatedNotifications = notifications.slice(offset, offset + limit);

            // Mark as read if specified
            if (options.markAsRead) {
                await Promise.all(
                    paginatedNotifications
                        .filter(n => !n.is_read)
                        .map(n => Notification.markNotificationAsRead(n.id))
                );
            }

            return {
                notifications: paginatedNotifications,
                total: notifications.length,
                unreadCount: notifications.filter(n => !n.is_read).length,
                hasMore: notifications.length > offset + limit
            };
        } catch (error) {
            throw new Error(`Failed to get notifications: ${error.message}`);
        }
    }

    // Check follow status between two users
    static async checkFollowStatus(followerId, followedId) {
        try {
            if (followerId === followedId) return null;

            const followStatus = await Follower.getFollowersByUserIdAndFollowerId(followerId, followedId);
            return followStatus.length > 0;
        } catch (error) {
            throw new Error(`Failed to check follow status: ${error.message}`);
        }
    }

    // Get user stats
    static async getUserStats(userId) {
        try {
            const [postsCount, followersCount, followingCount] = await Promise.all([
                Post.getPostsCountByUser(userId),
                Follower.getFollowersCountByUserId(userId),
                Follower.getFollowingsCountByUserId(userId)
            ]);

            // You could add more stats here:
            // - Total likes received
            // - Total reposts received
            // - Engagement rate
            // - Account age

            return {
                postsCount,
                followersCount,
                followingCount,
                engagementRate: followersCount > 0
                    ? ((postsCount * 100) / followersCount).toFixed(2)
                    : 0
            };
        } catch (error) {
            throw new Error(`Failed to get user stats: ${error.message}`);
        }
    }
}

module.exports = UserService;