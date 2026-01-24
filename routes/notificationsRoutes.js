//notificationsRoutes.js
const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

// Import validations
const {
    markAsRead: markAsReadValidation,
    getNotifications: getNotificationsValidation,
    deleteNotification: deleteNotificationValidation,
    validate
} = require('../validations/notification.validation');

// Import rate limiters
const {
    generalLimiter,
    userActionLimiter,
    burstLimitMiddleware
} = require('../middlware/rateLimiter');

// Middleware
const authenticate = require('../middlware/authenticate');

// Apply authentication and burst protection to all routes
router.use(authenticate);
router.use(burstLimitMiddleware);

// Notification routes
router.get('/',
    generalLimiter,
    validate(getNotificationsValidation, 'query'),
    notificationsController.getNotifications
);

router.put('/:id/mark_as_read',
    userActionLimiter,
    validate(markAsReadValidation, 'params'),
    notificationsController.markNotificationAsRead
);

router.put('/mark_all_read',
    userActionLimiter,
    notificationsController.markAllAsRead
);

router.delete('/:id',
    userActionLimiter,
    validate(deleteNotificationValidation, 'params'),
    notificationsController.deleteNotification
);

router.delete('/',
    userActionLimiter,
    notificationsController.clearAllNotifications
);

router.get('/stats',
    generalLimiter,
    notificationsController.getNotificationStats
);

module.exports = router;