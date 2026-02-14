const Follower = require('../models/Follower');
const Notification = require('../models/Notification');
const User = require('../models/User');

class FollowerService {
    // Follow a user
    static async followUser(followerId, followingId) {
        try {
            // Check if users exist
            const [follower, following] = await Promise.all([
                User.findById(followerId),
                User.findById(followingId)
            ]);

            if (!follower || !following) {
                throw new Error('User not found');
            }

            // Check if already following
            const isAlreadyFollowing = await Follower.isFollowing(followerId, followingId);
            if (isAlreadyFollowing) {
                throw new Error('Already following this user');
            }

            // Check if trying to follow self
            if (followerId === followingId) {
                throw new Error('Cannot follow yourself');
            }

            // Create follow relationship
            const follow = await Follower.createFollower(followerId, followingId);

            // Create notification for the followed user
            await Notification.createNotification(followingId, followerId, 'follow');

            return {
                follow,
                message: 'Successfully followed user'
            };
        } catch (error) {
            throw new Error(`Failed to follow user: ${error.message}`);
        }
    }

    // Unfollow a user
    static async unfollowUser(followerId, followingId) {
        try {
            // Check if following relationship exists
            const isFollowing = await Follower.isFollowing(followerId, followingId);
            if (!isFollowing) {
                throw new Error('Not following this user');
            }

            // Remove follow relationship
            const unfollow = await Follower.deleteFollower(followerId, followingId);

            return {
                unfollow,
                message: 'Successfully unfollowed user'
            };
        } catch (error) {
            throw new Error(`Failed to unfollow user: ${error.message}`);
        }
    }

    // Get followers list
    static async getFollowers(userId, options = {}) {
        try {
            const { limit = 20, offset = 0 } = options;

            let followers = await Follower.getFollowersByUserId(userId);

            // Apply pagination
            const paginatedFollowers = followers.slice(offset, offset + limit);

            // Enrich with user data (already included in SQL join)
            const enrichedFollowers = paginatedFollowers.map((follower) => {
                return {
                    id: follower.follow_id,
                    created_at: follower.followed_at,
                    user: {
                        id: follower.user_id,
                        name: follower.name,
                        email: follower.email,
                        avatar: follower.avatar,
                        bio: follower.bio || '',
                        created_at: follower.user_created_at
                    }
                };
            });

            return {
                followers: enrichedFollowers,
                total: followers.length,
                hasMore: followers.length > offset + limit
            };
        } catch (error) {
            throw new Error(`Failed to get followers: ${error.message}`);
        }
    }

    // Get following list
    static async getFollowing(userId, options = {}) {
        try {
            const { limit = 20, offset = 0 } = options;

            let following = await Follower.getFollowingsByUserId(userId);

            // Apply pagination
            const paginatedFollowing = following.slice(offset, offset + limit);

            // Enrich with user data (already included in SQL join)
            const enrichedFollowing = paginatedFollowing.map((follow) => {
                return {
                    id: follow.follow_id,
                    created_at: follow.followed_at,
                    user: {
                        id: follow.user_id,
                        name: follow.name,
                        email: follow.email,
                        avatar: follow.avatar,
                        bio: follow.bio || '',
                        created_at: follow.user_created_at
                    }
                };
            });

            return {
                following: enrichedFollowing,
                total: following.length,
                hasMore: following.length > offset + limit
            };
        } catch (error) {
            throw new Error(`Failed to get following: ${error.message}`);
        }
    }

    // Check follow relationship
    static async checkRelationship(userId, targetId) {
        try {
            const [isFollowing, isFollowedBy] = await Promise.all([
                Follower.isFollowing(userId, targetId),
                Follower.isFollowing(targetId, userId)
            ]);

            return {
                isFollowing,
                isFollowedBy,
                mutual: isFollowing && isFollowedBy
            };
        } catch (error) {
            throw new Error(`Failed to check relationship: ${error.message}`);
        }
    }

    // Get follow recommendations
    static async getFollowRecommendations(userId, limit = 10) {
        try {
            // Get users that current user's followers are following
            const followers = await Follower.getFollowersByUserId(userId);
            const followerIds = followers.map(f => f.follower_user_id);

            if (followerIds.length === 0) {
                // If no followers, get popular users
                return this.getPopularUsers(userId, limit);
            }

            // Get users followed by current user's followers
            const recommendations = new Map();

            for (const followerId of followerIds) {
                const following = await Follower.getFollowingsByUserId(followerId);

                for (const follow of following) {
                    const targetId = follow.user_id;

                    // Skip self and users already followed
                    if (targetId === userId) continue;

                    const alreadyFollowing = await Follower.isFollowing(userId, targetId);
                    if (alreadyFollowing) continue;

                    if (recommendations.has(targetId)) {
                        recommendations.set(targetId, recommendations.get(targetId) + 1);
                    } else {
                        recommendations.set(targetId, 1);
                    }
                }
            }

            // Sort by common followers count and get top recommendations
            const sortedRecommendations = Array.from(recommendations.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit);

            // Get user details for recommendations
            const recommendedUsers = await Promise.all(
                sortedRecommendations.map(async ([targetId, commonFollowers]) => {
                    const user = await User.findById(targetId);

                    if (!user) return null;

                    const { password, ...safeUser } = user;

                    return {
                        ...safeUser,
                        commonFollowers,
                        isFollowing: false
                    };
                })
            );

            // Filter out null users and return
            return recommendedUsers.filter(user => user !== null);
        } catch (error) {
            throw new Error(`Failed to get follow recommendations: ${error.message}`);
        }
    }

    // Get popular users (fallback)
    static async getPopularUsers(excludeUserId, limit = 10) {
        try {
            // Get all users except the current one
            const allUsers = await User.getAllUsers();
            const filteredUsers = allUsers.filter(user => user.id !== excludeUserId);

            // Get follower counts for each user
            const usersWithFollowerCounts = await Promise.all(
                filteredUsers.map(async (user) => {
                    const followerCount = await Follower.getFollowersCountByUserId(user.id);
                    return {
                        user,
                        followerCount
                    };
                })
            );

            // Sort by follower count and get top users
            const popularUsers = usersWithFollowerCounts
                .sort((a, b) => b.followerCount - a.followerCount)
                .slice(0, limit)
                .map(item => {
                    if (!item.user) return null;

                    const { password, ...safeUser } = item.user;
                    return {
                        ...safeUser,
                        followerCount: item.followerCount,
                        isFollowing: false
                    };
                })
                .filter(user => user !== null);

            return popularUsers;
        } catch (error) {
            throw new Error(`Failed to get popular users: ${error.message}`);
        }
    }

    // Get followers count for multiple users
    static async getFollowersCounts(userIds) {
        try {
            const counts = {};
            for (const userId of userIds) {
                counts[userId] = await Follower.getFollowersCountByUserId(userId);
            }
            return counts;
        } catch (error) {
            throw new Error(`Failed to get follower counts: ${error.message}`);
        }
    }
}

module.exports = FollowerService;