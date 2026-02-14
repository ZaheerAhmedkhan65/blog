const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const Redis = require('ioredis');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Redis client for distributed rate limiting (optional)
const redisClient = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : null;


// General API rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.ip === '127.0.0.1', // Skip for localhost
    store: redisClient ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }) : undefined,
});

// Authentication-specific rate limiter (stricter)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 failed auth attempts per hour
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true, // Only count failed attempts
    keyGenerator: (req) => {
        // Use IP + username for more granular limiting
        return `${ipKeyGenerator(req)}${req.body.email || req.body.username || 'unknown'}`;
    }
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit to 3 reset attempts per hour
    message: 'Too many password reset attempts, please try again later.',
});

// Upload limiter
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit to 10 uploads per 15 minutes
    message: 'Too many uploads, please try again later.',
});

// Burst protection for endpoints that could be abused
const burstLimiter = new RateLimiterMemory({
    points: 10, // 10 requests
    duration: 1, // per second
});

// Middleware to handle burst limiting
const burstLimitMiddleware = async (req, res, next) => {
    try {
        const key = `${req.ip}:${req.path}`;
        await burstLimiter.consume(key);
        next();
    } catch (rlRejected) {
        res.status(429).json({
            error: 'Too many requests, please slow down.'
        });
    }
};

// Rate limiter for specific user actions
const userActionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 actions per minute
    message: 'Too many actions, please slow down.',
    keyGenerator: (req) => `${req.user?.userId || ipKeyGenerator(req) }:${req.path}`,
});

module.exports = {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    uploadLimiter,
    burstLimitMiddleware,
    userActionLimiter
};