const Joi = require('joi');

const followerValidation = {
    // Follow user validation
    followUser: Joi.object({
        id: Joi.number().integer().positive().required()
    }).params(),

    // Get followers/following validation
    getRelationships: Joi.object({
        id: Joi.number().integer().positive().required(),
        limit: Joi.number().integer().min(1).max(100).default(20),
        offset: Joi.number().integer().min(0).default(0)
    }).params(),

    // Check relationship validation
    checkRelationship: Joi.object({
        userId: Joi.number().integer().positive().required(),
        targetId: Joi.number().integer().positive().required()
    }).query()
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
    ...followerValidation,
    validate
};