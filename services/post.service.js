// services/post.service.js
const Post = require('../models/Post');
const User = require('../models/User');
const PostLike = require('../models/PostLike');
const PostRepost = require('../models/PostRepost');
const Notification = require('../models/Notification');
const Follower = require('../models/Follower');

class PostService {
    // Create a new post
    static async createPost(postData, userId) {
        try {
            const {
                content,
                media_url = null,
                parent_post_id = null,
                is_draft = false,
                scheduled_at = null,
                published_at = null
            } = postData;

            // Handle publishing logic
            let finalPublishedAt = published_at;
            const isScheduled = scheduled_at && new Date(scheduled_at) > new Date();

            if (!is_draft && !isScheduled && !finalPublishedAt) {
                finalPublishedAt = new Date();
            }

            // Create the post
            const newPost = await Post.createPost(
                content,
                userId,
                media_url,
                parent_post_id,
                is_draft,
                scheduled_at,
                finalPublishedAt
            );

            // Get user info for response
            const user = await User.findById(userId);

            // Notify followers if post is published
            if (!is_draft && !isScheduled) {
                await this.notifyFollowersAboutNewPost(userId, newPost.id);
            }

            const post = {
                ...newPost,
                likes: 0,
                dislikes: 0,
                reposts: 0,
                userReaction: null,
                hasReposted: false,
                user: {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    email: user.email
                }
            }
            
            return {
                post
            };
        } catch (error) {
            throw new Error(`Failed to create post: ${error.message}`);
        }
    }

    // Get post by ID
    static async getPostById(postId, currentUserId = null) {
        try {
            const post = await Post.getPostDataById(postId);
            if (!post) {
                throw new Error('Post not found');
            }

            // Get engagement data
            const [reactions, repostCount, userReaction, hasReposted] = await Promise.all([
                Post.getReactions(postId),
                Post.getRepostCount(postId),
                currentUserId ? Post.getUserReaction(postId, currentUserId) : Promise.resolve(null),
                currentUserId ? Post.hasReposted(postId, currentUserId) : Promise.resolve(false)
            ]);

            // Get user info
            const user = await User.findById(post.user_id);

            return {
                ...post,
                user: {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    email: user.email
                },
                likes: reactions.likes,
                dislikes: reactions.dislikes,
                reposts: repostCount,
                userReaction,
                hasReposted,
                isOwner: currentUserId === post.user_id
            };
        } catch (error) {
            throw new Error(`Failed to get post: ${error.message}`);
        }
    }

    // Get posts by user
    static async getPostsByUser(userId, currentUserId = null, options = {}) {
        try {
            const { limit = 20, offset = 0, includeDrafts = false } = options;

            let posts = await Post.getPostsByUser(userId);

            // Filter out drafts if not requested
            if (!includeDrafts) {
                posts = posts.filter(post => !post.is_draft);
            }

            // Apply pagination
            const paginatedPosts = posts.slice(offset, offset + limit);

            // Get engagement data for each post
            const postsWithEngagement = await Promise.all(
                paginatedPosts.map(async (post) => {
                    const [reactions, repostCount, userReaction, hasReposted] = await Promise.all([
                        Post.getReactions(post.id),
                        Post.getRepostCount(post.id),
                        currentUserId ? Post.getUserReaction(post.id, currentUserId) : Promise.resolve(null),
                        currentUserId ? Post.hasReposted(post.id, currentUserId) : Promise.resolve(false)
                    ]);

                    return {
                        ...post,
                        user: {
                            id: post.user_id,
                            name: post.name,
                            avatar: post.avatar,
                            email: post.email
                        },
                        likes: reactions.likes,
                        dislikes: reactions.dislikes,
                        reposts: repostCount,
                        userReaction,
                        hasReposted,
                        isOwner: currentUserId === post.user_id
                    };
                })
            );

            return {
                posts: postsWithEngagement,
                total: posts.length,
                hasMore: posts.length > offset + limit
            };
        } catch (error) {
            throw new Error(`Failed to get user posts: ${error.message}`);
        }
    }

    // Update a post
    static async updatePost(postId, updateData, userId) {
        try {
            // Verify post exists and user owns it
            const existingPost = await Post.getPostById(postId);
            if (!existingPost) {
                throw new Error('Post not found');
            }

            if (existingPost.user_id !== userId) {
                throw new Error('Not authorized to update this post');
            }

            const {
                content,
                media_url = null,
                is_draft = false,
                scheduled_at = null,
                published_at = null
            } = updateData;

            // Handle publishing logic
            let finalPublishedAt = published_at;
            const isScheduled = scheduled_at && new Date(scheduled_at) > new Date();

            if (!is_draft && !isScheduled && !finalPublishedAt && existingPost.is_draft) {
                // If changing from draft to published and not scheduled
                finalPublishedAt = new Date();
            }

            const updatedPost = await Post.updatePost(
                postId,
                content,
                userId,
                media_url,
                existingPost.parent_post_id, // Keep original parent
                is_draft,
                scheduled_at,
                finalPublishedAt
            );

            // Get user info for response
            const user = await User.findById(userId);

            return {
               post: {
                   ...updatedPost,
                   user: {
                       id: user.id,
                       name: user.name,
                       avatar: user.avatar,
                       email: user.email
                   }
               }
            };
        } catch (error) {
            throw new Error(`Failed to update post: ${error.message}`);
        }
    }

    // Delete a post
    static async deletePost(postId, userId) {
        try {
            // Verify post exists and user owns it
            const existingPost = await Post.getPostById(postId);
            if (!existingPost) {
                throw new Error('Post not found');
            }

            if (existingPost.user_id !== userId) {
                throw new Error('Not authorized to delete this post');
            }

            const deletedPost = await Post.deletePost(postId);
            return deletedPost;
        } catch (error) {
            throw new Error(`Failed to delete post: ${error.message}`);
        }
    }

    // Like/dislike a post
    static async toggleLike(postId, userId, type) {
        try {
            // Verify post exists
            const post = await Post.getPostById(postId);
            if (!post) {
                throw new Error('Post not found');
            }

            // Check if user is trying to like/dislike their own post
            if (post.user_id === userId) {
                throw new Error('Cannot react to your own post');
            }

            const result = await Post.toggleLike(postId, userId, type);
            const reactions = await Post.getReactions(postId);
            const userReaction = await Post.getUserReaction(postId, userId);

            // Create notification if user reacted to someone else's post
            if (post.user_id !== userId) {
                await Notification.createNotification(post.user_id, userId, type, postId);
            }

            return {
                ...result,
                reactions,
                userReaction
            };
        } catch (error) {
            throw new Error(`Failed to process reaction: ${error.message}`);
        }
    }

    // Repost a post
    static async toggleRepost(postId, userId) {
        try {
            // Verify post exists
            const post = await Post.getPostById(postId);
            if (!post) {
                throw new Error('Post not found');
            }

            // Check if user is trying to repost their own post
            if (post.user_id === userId) {
                throw new Error('Cannot repost your own post');
            }

            const result = await Post.toggleRepost(postId, userId);
            const repostCount = await Post.getRepostCount(postId);
            const hasReposted = await Post.hasReposted(postId, userId);

            // Create notification if user reposted someone else's post
            if (post.user_id !== userId) {
                await Notification.createNotification(post.user_id, userId, 'repost', postId);
            }

            return {
                ...result,
                repostCount,
                hasReposted
            };
        } catch (error) {
            throw new Error(`Failed to process repost: ${error.message}`);
        }
    }

    // Search posts
    static async searchPosts(query, currentUserId = null, options = {}) {
        try {
            const { limit = 20, offset = 0 } = options;

            const results = await Post.searchPost(query);

            // Apply pagination
            const paginatedResults = results.slice(offset, offset + limit);

            // Get engagement data for each post
            const postsWithEngagement = await Promise.all(
                paginatedResults.map(async (post) => {
                    const [reactions, repostCount, userReaction, hasReposted] = await Promise.all([
                        Post.getReactions(post.id),
                        Post.getRepostCount(post.id),
                        currentUserId ? Post.getUserReaction(post.id, currentUserId) : Promise.resolve(null),
                        currentUserId ? Post.hasReposted(post.id, currentUserId) : Promise.resolve(false)
                    ]);

                    // Get user info
                    const user = await User.findById(post.user_id);

                    return {
                        ...post,
                        user: {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar,
                            email: user.email
                        },
                        likes: reactions.likes,
                        dislikes: reactions.dislikes,
                        reposts: repostCount,
                        userReaction,
                        hasReposted,
                        isOwner: currentUserId === post.user_id
                    };
                })
            );

            return {
                posts: postsWithEngagement,
                total: results.length,
                hasMore: results.length > offset + limit
            };
        } catch (error) {
            throw new Error(`Failed to search posts: ${error.message}`);
        }
    }

    // Get trending posts
    static async getTrendingPosts(currentUserId = null, options = {}) {
        try {
            const { limit = 10, period = '24 HOUR' } = options;

            const trendingPosts = await Post.getTrendingPosts(limit, period);

            // Get all needed user IDs at once
            const userIds = [...new Set(trendingPosts.map(post => post.user_id))];
            const users = await User.findAll({ where: { id: userIds } });
            const userMap = new Map(users.map(user => [user.id, user]));

            // Get user reactions in bulk if logged in
            let userReactions = new Map();
            let userReposts = new Set();

            if (currentUserId) {
                const reactions = await PostLike.findAll({
                    where: {
                        post_id: trendingPosts.map(post => post.id),
                        user_id: currentUserId
                    }
                });
                reactions.forEach(r => userReactions.set(r.post_id, r.type));

                const reposts = await PostRepost.findAll({
                    where: {
                        post_id: trendingPosts.map(post => post.id),
                        user_id: currentUserId
                    }
                });
                reposts.forEach(r => userReposts.add(r.post_id));
            }

            // Build response
            const postsWithData = trendingPosts.map(post => ({
                ...post,
                user: userMap.get(post.user_id),
                userReaction: userReactions.get(post.id) || null,
                hasReposted: userReposts.has(post.id),
                isFallbackResults: post.is_fallback || false,
                isOwner: currentUserId === post.user_id
            }));

            return postsWithData;
        } catch (error) {
            throw new Error(`Failed to get trending posts: ${error.message}`);
        }
    }

    // Notify followers about new post
    static async notifyFollowersAboutNewPost(userId, postId) {
        try {
            const followers = await Follower.getFollowersByUserId(userId);

            // Create notifications in batches to avoid overwhelming the database
            const batchSize = 50;
            for (let i = 0; i < followers.length; i += batchSize) {
                const batch = followers.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(follower =>
                        Notification.createNotification(follower.follower_id, userId, 'new_post', postId)
                    )
                );
            }
        } catch (error) {
            // Don't throw error here - we don't want post creation to fail because of notifications
            console.error('Failed to notify followers:', error);
        }
    }

    // Get post analytics (views, engagement, etc.)
    static async getPostAnalytics(postId, userId) {
        try {
            const post = await Post.getPostById(postId);
            if (!post) {
                throw new Error('Post not found');
            }

            if (post.user_id !== userId) {
                throw new Error('Not authorized to view analytics for this post');
            }

            const [reactions, repostCount] = await Promise.all([
                Post.getReactions(postId),
                Post.getRepostCount(postId)
            ]);

            // Calculate engagement rate
            const followersCount = await Follower.getFollowersCountByUserId(userId);
            const engagementRate = followersCount > 0
                ? ((reactions.likes + repostCount) / followersCount) * 100
                : 0;

            return {
                postId,
                likes: reactions.likes,
                dislikes: reactions.dislikes,
                reposts: repostCount,
                totalEngagement: reactions.likes + repostCount,
                engagementRate: engagementRate.toFixed(2),
                netSentiment: reactions.likes - reactions.dislikes
            };
        } catch (error) {
            throw new Error(`Failed to get post analytics: ${error.message}`);
        }
    }
}

module.exports = PostService;