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
    reactPostParamsValidation,
    reactPostBodyValidation,
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

router.get('/users/:id',
    generalLimiter,
    validate(getUserPostsValidation, 'params'),
    PostsController.getAllUserPosts
);

router.post('/create',
    authenticate,
    userActionLimiter,
    validate(createPostValidation),
    PostsController.create
);

router.put('/:id/update',
    authenticate,
    userActionLimiter,
    validate(postIdValidation, 'params'),
    validate(updatePostValidation),
    PostsController.update
);

router.delete('/:id/delete',
    authenticate,
    userActionLimiter,
    validate(postIdValidation, 'params'),
    PostsController.destroy
);

router.put('/:postId/react',
    authenticate,
    userActionLimiter,
    validate(reactPostParamsValidation, 'params'),
    validate(reactPostBodyValidation, 'body'),
    PostsController.reactPost
);

router.post('/:postId/repost',
    authenticate,
    userActionLimiter,
    validate(repostPostValidation, 'params'),
    PostsController.repostPost
);

module.exports = router;