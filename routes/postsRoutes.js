//postsRoutes.js
const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/postsController');
const authenticate = require('../middlware/authenticate');

// Import validations and rate limiters
const {
    createPost: createPostValidation,
    updatePost: updatePostValidation,
    postId: postIdValidation,
    likePost: likePostValidation,
    repostPost: repostPostValidation,
    searchPosts: searchPostsValidation,
    getTrendingPosts: getTrendingPostsValidation,
    getUserPosts: getUserPostsValidation,
    validate
} = require('../validations/post.validation');

const {
    generalLimiter,
    userActionLimiter,
    burstLimitMiddleware
} = require('../middlware/rateLimiter');

router.use(authenticate);
router.use(burstLimitMiddleware);

router.get("/search",
    generalLimiter,
    validate(searchPostsValidation, 'query'),
    PostsController.searchPost
);

router.get('/trending',
    generalLimiter,
    validate(getTrendingPostsValidation, 'query'),
    PostsController.getTrendingPosts
);

router.post('/create',
    userActionLimiter,
    validate(createPostValidation),
    PostsController.create
);

router.get('/users/:id',
    generalLimiter,
    validate(getUserPostsValidation, 'params'),
    PostsController.getAllUserPosts
);

router.put('/:id/update',
    userActionLimiter,
    validate(postIdValidation, 'params'),
    validate(updatePostValidation),
    PostsController.update
);

router.delete('/:id/delete',
    userActionLimiter,
    validate(postIdValidation, 'params'),
    PostsController.destroy
);

router.post('/:postId/like',
    userActionLimiter,
    validate(likePostValidation, 'params'),
    validate(likePostValidation),
    PostsController.likePost
);

router.post('/:postId/repost',
    userActionLimiter,
    validate(repostPostValidation, 'params'),
    PostsController.repostPost
);

module.exports = router;