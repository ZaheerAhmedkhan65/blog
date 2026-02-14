//userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const postsController = require('../controllers/postsController');
const { storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });
const authenticate = require('../middlware/authenticate');
router.use(authenticate);

router.get('/suggested_user', userController.suggestedUser);
router.get('/:name', userController.profile);
router.post('/:id/avatar/update',upload.single('image'), userController.updateProfile);
router.get('/:name/status/:id', postsController.show);

module.exports = router;