//controllers/postsController.js
const PostService = require('../services/post.service');
const UserService = require('../services/user.service');
const { formatRelativeTime, formatNumberCompact } = require('../middlware/timeFormate');

const PostsController = {
    // Create a new post
    async create(req, res) {
        try {
            const postData = {
                ...req.body,
                media_url: req.file ? req.file.path : null
            };
            console.log("Creating post with data:", postData, "for user:", req.user.userId);
            const result = await PostService.createPost(postData, req.user.userId);
            console.log("Post created successfully:", result);
            res.status(201).json({
                success: true,
                data: {
                    ...result,
                    likes: formatNumberCompact(result.likes || 0),
                    dislikes: formatNumberCompact(result.dislikes || 0),
                    reposts: formatNumberCompact(result.reposts || 0)
                },
                message: result.is_draft ? "Post saved as draft" : "Post created successfully"
            });
        } catch (error) {
            console.error('Error creating post:', error);

            // Handle specific error types
            let statusCode = 500;
            let errorMessage = 'Internal Server Error';

            if (error.message.includes('validation') || error.message.includes('required')) {
                statusCode = 400;
                errorMessage = error.message;
            } else if (error.message.includes('not found')) {
                statusCode = 404;
                errorMessage = error.message;
            } else if (error.message.includes('authorized') || error.message.includes('permission')) {
                statusCode = 403;
                errorMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Get all posts by user
    async getAllUserPosts(req, res) {
        try {
            const { id } = req.params;
            const { limit = 20, offset = 0, includeDrafts = false } = req.query;
            console.log("getAllUserPosts called with:", { id, limit, offset, includeDrafts });
            const result = await PostService.getPostsByUser(
                parseInt(id),
                req.user.userId,
                {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    includeDrafts: includeDrafts === 'true'
                }
            );
            console.log("Posts fetched:", result);
            // Format the response
            const formattedPosts = result.posts.map(post => ({
                ...post,
                likes: formatNumberCompact(post.likes || 0),
                dislikes: formatNumberCompact(post.dislikes || 0),
                reposts: formatNumberCompact(post.reposts || 0),
                created_at: formatRelativeTime(post.created_at),
                user: {
                    ...post.user,
                    created_at: formatRelativeTime(post.user.created_at)
                }
            }));

            res.json({
                success: true,
                data: {
                    posts: formattedPosts,
                    pagination: {
                        total: result.total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: result.hasMore
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching posts:', error);

            const statusCode = error.message.includes('not found') ? 404 : 500;

            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to fetch posts'
            });
        }
    },

    // Get a single post by ID
    async show(req, res) {
        try {
            const { id } = req.params;
            const userData = await UserService.getProfile(req.params.name, req.user.userId);
            const post = await PostService.getPostById(parseInt(id), req.user.userId);

            if (!post) {
                return res.status(404).render('error', {
                    title: 'Post Not Found',
                    message: 'The post you are looking for does not exist.',
                    user: req.user
                });
            }

            // Format the post data for rendering
            const formattedPost = {
                ...post,
                likes: formatNumberCompact(post.likes || 0),
                dislikes: formatNumberCompact(post.dislikes || 0),
                reposts: formatNumberCompact(post.reposts || 0),
                created_at: formatRelativeTime(post.created_at),
                user: {
                    ...post.user,
                    created_at: formatRelativeTime(post.user.created_at)
                }
            };

            res.render('post/show', {
                post: formattedPost,
                user: req.user,
                userData,
                userId: req.user.userId,
                title: "Post"
            });
        } catch (error) {
            console.error('Error fetching post:', error);

            if (error.message.includes('not found')) {
                return res.status(404).render('error', {
                    title: 'Post Not Found',
                    message: 'The post you are looking for does not exist.',
                    user: req.user
                });
            }

            res.status(500).render('error', {
                title: 'Server Error',
                message: 'An error occurred while fetching the post.',
                user: req.user
            });
        }
    },

    // Update a post
    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = {
                ...req.body,
                media_url: req.file ? req.file.path : req.body.media_url
            };

            const result = await PostService.updatePost(
                parseInt(id),
                updateData,
                req.user.userId
            );

            res.json({
                success: true,
                data: {
                    ...result,
                    likes: formatNumberCompact(result.likes || 0),
                    dislikes: formatNumberCompact(result.dislikes || 0),
                    reposts: formatNumberCompact(result.reposts || 0)
                },
                message: "Post updated successfully"
            });
        } catch (error) {
            console.error('Error updating post:', error);

            let statusCode = 500;
            let errorMessage = 'Internal Server Error';

            if (error.message.includes('not found')) {
                statusCode = 404;
                errorMessage = error.message;
            } else if (error.message.includes('authorized')) {
                statusCode = 403;
                errorMessage = error.message;
            } else if (error.message.includes('validation')) {
                statusCode = 400;
                errorMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    },

    // Delete a post
    async destroy(req, res) {
        try {
            const { id } = req.params;

            const deletedPost = await PostService.deletePost(parseInt(id), req.user.userId);

            res.json({
                success: true,
                data: deletedPost,
                message: 'Post deleted successfully.'
            });
        } catch (error) {
            console.error('Error deleting post:', error);

            let statusCode = 500;
            let errorMessage = 'Internal Server Error';

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

    // Search posts
    async searchPost(req, res) {
        try {
            const { query, limit = 20, offset = 0 } = req.query;

            const result = await PostService.searchPosts(
                query,
                req.user.userId,
                {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            );

            // Format posts for rendering
            const formattedPosts = result.posts.map(post => ({
                ...post,
                likes: formatNumberCompact(post.likes || 0),
                dislikes: formatNumberCompact(post.dislikes || 0),
                reposts: formatNumberCompact(post.reposts || 0),
                created_at: formatRelativeTime(post.created_at),
                user: {
                    ...post.user,
                    created_at: formatRelativeTime(post.user.created_at)
                }
            }));

            res.render('search_results', {
                title: 'Search Results',
                posts: formattedPosts,
                query: query,
                user: req.user,
                pagination: {
                    total: result.total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: result.hasMore
                }
            });
        } catch (error) {
            console.error('Error searching posts:', error);

            res.render('search_results', {
                title: 'Search Results',
                posts: [],
                query: req.query.query,
                user: req.user,
                error: 'Failed to search posts. Please try again.'
            });
        }
    },

    // Like/dislike a post
    async likePost(req, res) {
        try {
            const { postId } = req.params;
            const { type } = req.body;

            const result = await PostService.toggleLike(
                parseInt(postId),
                req.user.userId,
                type
            );

            res.json({
                success: true,
                data: {
                    ...result,
                    reactions: {
                        ...result.reactions,
                        likes: formatNumberCompact(result.reactions.likes || 0),
                        dislikes: formatNumberCompact(result.reactions.dislikes || 0)
                    }
                },
                message: result.action === 'added' ?
                    `Post ${type}d successfully` :
                    result.action === 'removed' ?
                        'Reaction removed successfully' :
                        'Reaction updated successfully'
            });
        } catch (error) {
            console.error('Error liking post:', error);

            let statusCode = 500;
            let errorMessage = 'Failed to process reaction';

            if (error.message.includes('not found')) {
                statusCode = 404;
                errorMessage = error.message;
            } else if (error.message.includes('own post')) {
                statusCode = 400;
                errorMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    },

    // Repost a post
    async repostPost(req, res) {
        try {
            const { postId } = req.params;

            const result = await PostService.toggleRepost(
                parseInt(postId),
                req.user.userId
            );

            res.json({
                success: true,
                data: {
                    ...result,
                    repostCount: formatNumberCompact(result.repostCount || 0)
                },
                message: result.action === 'added' ?
                    'Post reposted successfully' :
                    'Repost removed successfully'
            });
        } catch (error) {
            console.error('Error reposting post:', error);

            let statusCode = 500;
            let errorMessage = 'Failed to process repost';

            if (error.message.includes('not found')) {
                statusCode = 404;
                errorMessage = error.message;
            } else if (error.message.includes('own post')) {
                statusCode = 400;
                errorMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    },

    // Get trending posts
    async getTrendingPosts(req, res) {
        try {
            const { limit = 10, period = '24 HOUR' } = req.query;

            const trendingPosts = await PostService.getTrendingPosts(req.user.userId, {
                limit: parseInt(limit),
                period
            });

            console.log("Trending posts fetched:", trendingPosts);

            // Format the response
            const formattedPosts = trendingPosts.map(post => ({
                ...post,
                likes: formatNumberCompact(post.likes || 0),
                dislikes: formatNumberCompact(post.dislikes || 0),
                reposts: formatNumberCompact(post.reposts || 0),
                created_at: formatRelativeTime(post.created_at),
                user: {
                    ...post.user,
                    created_at: formatRelativeTime(post.user.created_at)
                },
                engagement_score: post.engagement_score ? Math.round(post.engagement_score * 100) / 100 : 0
            }));

            console.log("Formatted posts:", formattedPosts);

            res.json({
                success: true,
                data: {
                    posts: formattedPosts,
                    period,
                    limit: parseInt(limit),
                    fallbackUsed: formattedPosts.some(post => post.isFallbackResults)
                }
            });
        } catch (error) {
            console.error('Error fetching trending posts:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to fetch trending posts',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Get post analytics
    async getPostAnalytics(req, res) {
        try {
            const { id } = req.params;

            const analytics = await PostService.getPostAnalytics(
                parseInt(id),
                req.user.userId
            );

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            console.error('Error getting post analytics:', error);

            let statusCode = 500;
            let errorMessage = 'Failed to get post analytics';

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
    }
};

module.exports = PostsController;