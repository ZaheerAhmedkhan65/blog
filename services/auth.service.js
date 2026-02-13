const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

class AuthService {
    // Signup service
    static async signup(userData) {
        try {
            // Check if user already exists
            const existingUser = await User.findUser(userData.name);
            if (existingUser) {
                throw new Error('User already exists');
            }

            // Check if email exists
            const existingEmail = await User.findByEmail(userData.email);
            if (existingEmail) {
                throw new Error('Email already registered');
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create the user
            const user = await User.createUser(
                userData.name,
                userData.email,
                hashedPassword,
                userData.imagePath || null,
                userData.filename || null
            );

            // Generate JWT token
            const token = this.generateToken(user);

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                token
            };
        } catch (error) {
            throw new Error(`Signup failed: ${error.message}`);
        }
    }

    // Login service
    static async login(credentials) {
        try {
            // Find the user by username or email
            const user = await User.findUser(credentials.name);
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }

            // Check if account is locked (optional feature)
            if (user.is_locked) {
                throw new Error('Account is temporarily locked. Please contact support.');
            }

            // Update last login timestamp (optional)
            // await User.updateLastLogin(user.id);

            // Generate JWT token
            const token = this.generateToken(user);

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                token
            };
        } catch (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    // Forgot password service
    static async forgotPassword(email) {
        try {
            const user = await User.findByEmail(email);
            if (!user) {
                // Don't reveal if user exists for security
                return { message: 'If an account exists with this email, you will receive a reset link.' };
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

            // Save token to database
            await User.updateUser(user.id, {
                resetToken,
                resetTokenExpiry: resetTokenExpiry.toISOString().slice(0, 19).replace('T', ' ')
            });

            // Send reset email
            const resetUrl = `${process.env.FRONTEND_URL || process.env.BASE_URL}/auth/reset-password/${resetToken}`;

            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request',
                template: 'password-reset',
                context: {
                    name: user.name,
                    resetUrl,
                    expiryHours: 1
                }
            });

            return { message: 'Password reset email sent.' };
        } catch (error) {
            throw new Error(`Password reset failed: ${error.message}`);
        }
    }

    // Reset password service
    static async resetPassword(token, newPassword) {
        try {
            // Find user by valid token
            const user = await User.findByResetToken(token);
            if (!user) {
                throw new Error('Invalid or expired reset token');
            }

            // Check if token has expired
            if (new Date(user.resetTokenExpiry) < new Date()) {
                throw new Error('Reset token has expired');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear reset token
            await User.updateUserPassword(user.id, {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            });

            // Send confirmation email
            await sendEmail({
                to: user.email,
                subject: 'Password Changed Successfully',
                template: 'password-changed',
                context: {
                    name: user.name
                }
            });

            return { message: 'Password reset successful.' };
        } catch (error) {
            throw new Error(`Password reset failed: ${error.message}`);
        }
    }

    // Refresh token service
    static async refreshToken(oldToken) {
        try {
            const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });

            // Verify user still exists
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new Error('User no longer exists');
            }

            // Generate new token
            const newToken = this.generateToken(user);

            return {
                token: newToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                }
            };
        } catch (error) {
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }

    // Logout service
    static async logout(userId, token = null) {
        try {
            // In a more advanced setup, you could:
            // 1. Add token to a blacklist
            // 2. Update user's last logout timestamp
            // 3. Clear any active sessions
            return { message: 'Logged out successfully' };
        } catch (error) {
            throw new Error(`Logout failed: ${error.message}`);
        }
    }

    // Generate JWT token
    static generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                username: user.name,
                email: user.email,
                avatar: user.avatar
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY || '7d',
                issuer: process.env.JWT_ISSUER || 'your-app-name'
            }
        );
    }

    // Verify token
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = AuthService;