//controllers/userController.js
const UserService = require('../services/user.service');
const PostService = require('../services/post.service');
const FollowerService = require('../services/follower.service');
const NotificationService = require('../services/notification.service');
const MediaService = require('../services/media.service');
const { formateDate, formatRelativeTime, formatNumberCompact } = require('../middlware/timeFormate');

const userController = {
    // Get user profile
    async profile(req, res) {
        try {
            const { name } = req.params;
            const currentUserId = req.user?.userId || null;

            const userData = await UserService.getProfile(name, currentUserId);

            userData.created_at = formateDate(userData.created_at);

            res.status(200).render("user/profile", {
                user: req.user,
                userData,
                title: "Profile",
                userId: req.user?.userId || null
            });
        } catch (error) {
            console.error('Error getting user profile:', error);
            res.status(404).render('error', {
                message: error.message || 'User not found',
                title: 'User Not Found',
                user: req.user
            });
        }
    },

    // Update profile (avatar)
    async updateProfile(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            // Verify user owns this profile
            if (parseInt(id) !== userId) {
                return res.status(403).json({ error: 'Not authorized to update this profile' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No image provided' });
            }

            // Upload avatar using MediaService
            const uploadResult = await MediaService.uploadImage(req.file, {
                type: 'avatar',
                folder: 'avatars'
            });

            // Update user with new avatar
            const updatedUser = await UserService.updateAvatar(userId, {
                avatar: uploadResult.url,
                avatar_public_id: uploadResult.public_id
            });

            res.json({
                user: updatedUser,
                message: "Profile updated successfully"
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get suggested users
    async suggestedUser(req, res) {
        try {
            const currentUserId = req.user.userId;
            const suggestedUsers = await UserService.getSuggestedUsers(currentUserId);
            
            res.json(suggestedUsers);
        } catch (error) {
            console.error('Error getting suggested users:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Follow user
    async followUser(req, res) {
        try {
            const followingId = parseInt(req.params.id);
            const followerId = req.user.userId;

            const result = await FollowerService.followUser(followerId, followingId);

            res.json(result);
        } catch (error) {
            console.error('Error following user:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Unfollow user
    async unfollowUser(req, res) {
        try {
            const followingId = parseInt(req.params.id);
            const followerId = req.user.userId;

            const result = await FollowerService.unfollowUser(followerId, followingId);

            res.json(result);
        } catch (error) {
            console.error('Error unfollowing user:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get followers list
    async followers(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { limit = 20, offset = 0 } = req.query;

            const result = await FollowerService.getFollowers(userId, { limit, offset });
            // Format timestamps
            result.followers = result.followers.map(follower => ({
                ...follower,
                followed_at: formatRelativeTime(follower.created_at)
            }));
            
            res.json({
                success: true,
                data: {
                    followers: result.followers,
                    pagination: {
                        total: result.total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: result.hasMore
                    }
                }
            });
        } catch (error) {
            console.error('Error getting followers:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get following list
    async following(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { limit = 20, offset = 0 } = req.query;

            const result = await FollowerService.getFollowing(userId, { limit, offset });
            // Format timestamps
            result.following = result.following.map(follow => ({
                ...follow,
                followed_at: formatRelativeTime(follow.created_at)
            }));
            
            res.json({
                success: true,
                data: {
                    following: result.following,
                    pagination: {
                        total: result.total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: result.hasMore
                    }
                }
            });
        } catch (error) {
            console.error('Error getting following:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get notifications
    async notifications(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const currentUserId = req.user.userId;

            // Verify user owns these notifications
            if (userId !== currentUserId) {
                return res.status(403).json({ error: 'Not authorized to view these notifications' });
            }

            const {
                limit = 20,
                offset = 0,
                unreadOnly = false,
                markAsRead = false
            } = req.query;

            const result = await UserService.getNotifications(userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                unreadOnly: unreadOnly === 'true',
                markAsRead: markAsRead === 'true'
            });

            // Format timestamps
            result.notifications = result.notifications.map(notification => ({
                ...notification,
                created_at: formatRelativeTime(notification.created_at)
            }));

            res.json(result);
        } catch (error) {
            console.error('Error getting notifications:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async updateProfileDetails(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            // Verify user owns this profile
            if (parseInt(id) !== userId) {
                return res.status(403).json({ error: 'Not authorized to update this profile' });
            }

            const { name, bio, website, location } = req.body;

            const updatedUser = await UserService.updateProfile(userId, {
                name,
                bio,
                website,
                location
            });

            res.json({
                user: updatedUser,
                message: "Profile updated successfully"
            });
        } catch (error) {
            console.error('Error updating profile details:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get user statistics
    async getUserStats(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            // Verify user can view these stats
            if (parseInt(id) !== userId) {
                return res.status(403).json({ error: 'Not authorized to view these statistics' });
            }

            const stats = await UserService.getUserStats(userId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting user stats:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Search users
    async searchUsers(req, res) {
        try {
            const { q, limit = 20, offset = 0 } = req.query;
            const currentUserId = req.user.userId;

            const result = await UserService.searchUsers(q, currentUserId, parseInt(limit), parseInt(offset));

            res.json({
                success: true,
                data: {
                    users: result.users,
                    pagination: {
                        total: result.total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: result.hasMore
                    }
                }
            });
        } catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ error: error.message });
        }
    }

};

module.exports = userController;