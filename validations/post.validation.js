//validations/post.validation.js
const Joi = require('joi');

const postValidation = {
    // Create post validation
    createPost: Joi.object({
        content: Joi.string()
            .min(1)
            .max(500)
            .required()
            .messages({
                'string.min': 'Post content cannot be empty',
                'string.max': 'Post content cannot exceed 5000 characters',
                'any.required': 'Content is required'
            }),
        media_url: Joi.string().uri().max(1000).optional(),
        parent_post_id: Joi.number().integer().positive().optional(),
        is_draft: Joi.boolean().default(false),
        scheduled_at: Joi.date().iso().min('now').optional(),
        published_at: Joi.date().iso().optional()
    }),

    // Update post validation
    updatePost: Joi.object({
        content: Joi.string()
            .min(1)
            .max(500)
            .required()
            .messages({
                'string.min': 'Post content cannot be empty',
                'string.max': 'Post content cannot exceed 5000 characters',
                'any.required': 'Content is required'
            }),
        media_url: Joi.string().uri().max(1000).optional(),
        is_draft: Joi.boolean().optional(),
        scheduled_at: Joi.date().iso().optional(),
        published_at: Joi.date().iso().optional()
    }),

    // Post ID validation
    postId: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    // Like/Dislike validation
    reactPostParamsValidation: Joi.object({
        postId: Joi.number().integer().required()
    }),

    reactPostBodyValidation: Joi.object({
        type: Joi.string().valid('like', 'dislike').required()
    }),

    // Repost validation
    repostPost: Joi.object({
        postId: Joi.number().integer().positive().required()
    }),

    // Search validation
    searchPosts: Joi.object({
        query: Joi.string().min(1).max(100).required(),
        limit: Joi.number().integer().min(1).max(100).default(20),
        offset: Joi.number().integer().min(0).default(0)
    }),

    // Trending posts validation
    getTrendingPosts: Joi.object({
        limit: Joi.number().integer().min(1).max(50).default(10),
        period: Joi.string()
            .valid('1 HOUR', '24 HOUR', '7 DAY', '30 DAY')
            .default('24 HOUR')
    }),

    // Get user posts validation
    getUserPosts: Joi.object({
        id: Joi.number().integer().positive().required(),
        limit: Joi.number().integer().min(1).max(100).default(20),
        offset: Joi.number().integer().min(0).default(0)
    })
};

const validate = (schema, property = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
    });

    if (error) {
        const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));

        return res.status(400).json({
            error: 'Validation Error',
            details: errors
        });
    }

    req[property] = value;
    next();
};

module.exports = {
    ...postValidation,
    validate
};