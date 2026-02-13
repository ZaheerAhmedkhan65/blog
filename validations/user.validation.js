const Joi = require('joi');

const userValidation = {
    // Update profile validation
    updateProfile: Joi.object({
        name: Joi.string()
            .min(3)
            .max(100)
            .pattern(/^[a-zA-Z0-9_]+$/)
            .optional(),
        bio: Joi.string().max(500).optional(),
        website: Joi.string().uri().max(255).optional(),
        location: Joi.string().max(100).optional(),
        image: Joi.object({
            fieldname: Joi.string(),
            originalname: Joi.string(),
            encoding: Joi.string(),
            mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
            size: Joi.number().max(5 * 1024 * 1024) // 5MB
        }).optional()
    }),

    // Follow/Unfollow validation
    followUser: Joi.object({
        userId: Joi.number().integer().positive().required()
    }).params(),

    // Get user validation
    getUser: Joi.object({
        name: Joi.string().required()
    }).params(),

    // Get notifications validation
    getNotifications: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(20),
        offset: Joi.number().integer().min(0).default(0)
    }).query(),

    // Search users validation
    searchUsers: Joi.object({
        q: Joi.string().min(1).max(100).required(),
        limit: Joi.number().integer().min(1).max(50).default(20)
    }).query()
};

// Validation middleware for params, query, and body
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
    ...userValidation,
    validate
};