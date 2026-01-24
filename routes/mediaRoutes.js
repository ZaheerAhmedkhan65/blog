//mediaRoutes.js
const express = require('express');
const router = express.Router();
const MediaController = require('../controllers/mediaController');

// Import validations
const { validate } = require('../validations/media.validation');

// Import rate limiters
const {
    uploadLimiter,
    burstLimitMiddleware,
    generalLimiter,
    userActionLimiter
} = require('../middlware/rateLimiter');

// Multer configuration
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
        }
    }
});

// Middleware
const authenticate = require('../middlware/authenticate');

// Apply authentication to upload routes
router.use(authenticate);
router.use(burstLimitMiddleware);

// Upload routes
router.post('/upload',
    uploadLimiter,
    upload.single('image'),
    MediaController.uploadImage
);

router.post('/upload/multiple',
    uploadLimiter,
    upload.array('images', 5), // Max 5 files
    MediaController.uploadMultipleImages
);

router.post('/crop',
    uploadLimiter,
    MediaController.cropImage
);

router.delete('/:public_id',
    userActionLimiter,
    MediaController.deleteImage
);

router.get('/info/:public_id',
    generalLimiter,
    MediaController.getImageInfo
);

module.exports = router;
