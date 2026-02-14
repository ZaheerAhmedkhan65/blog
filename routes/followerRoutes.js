//followerRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/:id/followers', userController.followers);
router.get('/:id/following', userController.following);
router.post('/:id/follow', userController.followUser);
router.post('/:id/unfollow', userController.unfollowUser);
router.get('/:id/notifications', userController.notifications);
module.exports = router;