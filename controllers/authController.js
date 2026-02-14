//authController.js
const AuthService = require('../services/auth.service');

const authController = {
    signup: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            let imagePath = null;
            let filename = null;

            if (req.file) {
                imagePath = req.file.path;
                filename = req.file.filename;
            }

            const result = await AuthService.signup({
                name,
                email,
                password,
                imagePath,
                filename
            });

            // Set token in cookie
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.status(201).redirect('/auth/signin');
        } catch (error) {
            console.error('Signup error:', error);
            res.status(400).render('auth/signup', {
                title: "Sign up",
                user: null,
                error: error.message
            });
        }
    },

    login: async (req, res) => {
        try {
            const { name, password } = req.body;

            const result = await AuthService.login({ name, password });

            // Set token in cookie
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.redirect('/');
        } catch (error) {
            console.error('Login error:', error);
            res.status(400).render('auth/signin', {
                title: "Sign in",
                user: null,
                error: error.message
            });
        }
    },

    logout: (req, res) => {
        try {
            const token = req.cookies.token;
            const userId = req.user?.userId;

            // You could add token to blacklist here if needed
            // await AuthService.logout(userId, token);

            res.clearCookie('token');
            res.redirect('/auth/signin');
        } catch (error) {
            console.error('Logout error:', error);
            res.redirect('/');
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            const result = await AuthService.forgotPassword(email);

            res.render('auth/forgot-password', {
                title: 'Forgot Password',
                user: null,
                message: result.message
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.render('auth/forgot-password', {
                title: 'Forgot Password',
                user: null,
                error: error.message
            });
        }
    },

    refreshToken: async (req, res) => {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const result = await AuthService.refreshToken(token);

            // Set new token in cookie
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({ success: true, user: result.user });
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token } = req.params;

            // Verify token is valid
            // You might want to add a service method to verify reset token
            // For now, just render the reset form

            res.render('auth/reset-password', {
                title: 'Reset Password',
                user: null,
                token,
                valid: true
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.redirect("/auth/signup");
        }
    },

    updatePassword: async (req, res) => {
        try {
            const { token, password } = req.body;

            const result = await AuthService.resetPassword(token, password);

            res.render('auth/signin', {
                title: 'Sign In',
                user: null,
                message: result.message
            });
        } catch (error) {
            console.error('Update password error:', error);
            res.render('auth/reset-password', {
                title: 'Reset Password',
                user: null,
                token: req.body.token,
                error: error.message
            });
        }
    }
};

module.exports = authController;