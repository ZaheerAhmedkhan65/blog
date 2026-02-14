const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const user = req.user;
        return res.render('index', { title: 'Blog', user, userId: req.user.userId || null });
    } catch (error) {
        console.error(error);
        return res.status(401).redirect('/auth/signin');
    }
});

module.exports = router;