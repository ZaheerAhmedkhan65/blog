const Joi = require('joi');

const authValidation = {
    // Signup validation
    signup: Joi.object({
        name: Joi.string()
            .min(3)
            .max(100)
            .required()
            .pattern(/^[a-zA-Z0-9_]+$/)
            .messages({
                'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username must be less than 100 characters',
                'any.required': 'Username is required'
            }),
        email: Joi.string()
            .email()
            .required()
            .max(255)
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(8)
            .required()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'any.required': 'Password is required'
            }),
        // image: Joi.object({
        //     fieldname: Joi.string(),
        //     originalname: Joi.string(),
        //     encoding: Joi.string(),
        //     mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
        //     size: Joi.number().max(5 * 1024 * 1024) // 5MB
        // }).optional()
    }),

    // Signin validation
    signin: Joi.object({
        name: Joi.string().required(),
        password: Joi.string().required()
    }),

    // Forgot password validation
    forgotPassword: Joi.object({
        email: Joi.string().email().required().max(255)
    }),

    // Reset password validation
    resetPassword: Joi.object({
        token: Joi.string().required(),
        password: Joi.string()
            .min(8)
            .required()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
        confirmPassword: Joi.string()
            .valid(Joi.ref('password'))
            .required()
    }),

    // Refresh token validation
    refreshToken: Joi.object({
        token: Joi.string().optional()
    })
};

// Validation middleware
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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

    req.body = value;
    next();
};

module.exports = {
    ...authValidation,
    validate
};