//routes/indexRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const user = req.user || null;
        return res.render('index', {
            title: 'Blog',
            user,
            userId: user?.userId || null
        });
    } catch (error) {
        console.error(error);
        return res.redirect('/auth/signin');
    }
});

module.exports = router;