const Joi = require('joi');

const mediaValidation = {
    // Upload image validation
    uploadImage: Joi.object({
        folder: Joi.string().max(100).optional(),
        transformation: Joi.array().items(
            Joi.object({
                width: Joi.number().integer().min(1).max(5000),
                height: Joi.number().integer().min(1).max(5000),
                crop: Joi.string().valid('fill', 'fit', 'crop', 'thumb', 'scale'),
                quality: Joi.string().valid('auto', 'good', 'best', 'eco'),
                format: Joi.string().valid('auto', 'jpg', 'png', 'webp', 'gif')
            })
        ).optional()
    }),

    // Crop image validation
    cropImage: Joi.object({
        public_id: Joi.string().required(),
        x: Joi.number().integer().min(0).required(),
        y: Joi.number().integer().min(0).required(),
        width: Joi.number().integer().min(1).max(5000).required(),
        height: Joi.number().integer().min(1).max(5000).required()
    }),

    // Delete image validation
    deleteImage: Joi.object({
        public_id: Joi.string().required()
    }),

    // Get image info validation
    getImageInfo: Joi.object({
        public_id: Joi.string().required()
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
    ...mediaValidation,
    validate
};