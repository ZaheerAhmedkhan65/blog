const authenticate = require('../middlware/authenticate');

const authRoutes = require('./authRoutes');
const indexRoutes = require('./indexRoutes');
const userRoutes = require('./userRoutes');
const followerRoutes = require('./followerRoutes');
const mediaRoutes = require('./mediaRoutes');
const notificationsRoutes = require('./notificationsRoutes');
const postsRoutes = require('./postsRoutes');

module.exports = (app) => {

    // Public
    app.use('/auth', authRoutes);

    // Protected
    app.use('/', authenticate, indexRoutes);
    app.use('/', authenticate, userRoutes);
    app.use('/users', authenticate, followerRoutes);
    app.use('/media', authenticate, mediaRoutes);
    app.use('/notifications', authenticate, notificationsRoutes);
    app.use('/posts', authenticate, postsRoutes);
};