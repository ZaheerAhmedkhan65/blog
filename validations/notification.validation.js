const Joi = require('joi');

const notificationValidation = {
    // Mark as read validation
    markAsRead: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    // Get notifications validation
    getNotifications: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(20),
        offset: Joi.number().integer().min(0).default(0),
        unreadOnly: Joi.boolean().default(false)
    }),

    // Delete notification validation
    deleteNotification: Joi.object({
        id: Joi.number().integer().positive().required()
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
    ...notificationValidation,
    validate
};