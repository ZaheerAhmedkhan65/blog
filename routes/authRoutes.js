//authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const jwt = require('jsonwebtoken');

// Import validations and rate limiters
const {
    signup: signupValidation,
    signin: signinValidation,
    forgotPassword: forgotPasswordValidation,
    resetPassword: resetPasswordValidation,
    validate
} = require('../validations/auth.validation');

const {
    authLimiter,
    passwordResetLimiter,
    generalLimiter,
    burstLimitMiddleware
} = require('../middlware/rateLimiter');

router.get('/signup', (req, res) => { 
     res.render('auth/signup', { title: "Sign up" });
});

router.get('/signin', (req, res) => {
    res.render('auth/signin', { title: "Sign in" });
});

router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', { title: "Forgot Password" });
});

router.get('/reset-password/:token', authController.resetPassword);

// Apply rate limiting and validation
router.post('/signup',
    burstLimitMiddleware,
    authLimiter,
    upload.single('image'),
    validate(signupValidation),
    authController.signup
);

router.post('/signin',
    burstLimitMiddleware,
    authLimiter,
    validate(signinValidation),
    authController.login
);

router.post('/forgot-password',
    burstLimitMiddleware,
    passwordResetLimiter,
    validate(forgotPasswordValidation),
    authController.forgotPassword
);

router.post('/reset-password',
    burstLimitMiddleware,
    validate(resetPasswordValidation),
    authController.updatePassword
);

router.get('/logout', authController.logout);

router.post('/refresh-token',
    burstLimitMiddleware,
    authController.refreshToken
);

module.exports = router;