const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        this.templates = {
            'password-reset': {
                subject: 'Password Reset Request',
                html: (context) => `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                            .content { padding: 30px; background-color: #f9f9f9; }
                            .button { 
                                display: inline-block; 
                                padding: 12px 24px; 
                                background-color: #4F46E5; 
                                color: white; 
                                text-decoration: none; 
                                border-radius: 5px; 
                                margin: 20px 0; 
                            }
                            .footer { 
                                margin-top: 30px; 
                                padding-top: 20px; 
                                border-top: 1px solid #ddd; 
                                color: #666; 
                                font-size: 12px; 
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Password Reset</h1>
                            </div>
                            <div class="content">
                                <p>Hello ${context.name},</p>
                                <p>We received a request to reset your password. Click the button below to reset it:</p>
                                <p style="text-align: center;">
                                    <a href="${context.resetUrl}" class="button">Reset Password</a>
                                </p>
                                <p>This link will expire in ${context.expiryHours} hour${context.expiryHours > 1 ? 's' : ''}.</p>
                                <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
                            </div>
                            <div class="footer">
                                <p>This email was sent by Your App Name.</p>
                                <p>If you have any questions, contact us at support@yourapp.com</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            },
            'password-changed': {
                subject: 'Password Changed Successfully',
                html: (context) => `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
                            .content { padding: 30px; background-color: #f9f9f9; }
                            .footer { 
                                margin-top: 30px; 
                                padding-top: 20px; 
                                border-top: 1px solid #ddd; 
                                color: #666; 
                                font-size: 12px; 
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Password Updated</h1>
                            </div>
                            <div class="content">
                                <p>Hello ${context.name},</p>
                                <p>Your password has been successfully changed.</p>
                                <p>If you did not make this change, please contact our support team immediately.</p>
                            </div>
                            <div class="footer">
                                <p>This email was sent by Your App Name.</p>
                                <p>If you have any questions, contact us at support@yourapp.com</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            },
            'welcome': {
                subject: 'Welcome to Our Platform!',
                html: (context) => `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                            .content { padding: 30px; background-color: #f9f9f9; }
                            .button { 
                                display: inline-block; 
                                padding: 12px 24px; 
                                background-color: #4F46E5; 
                                color: white; 
                                text-decoration: none; 
                                border-radius: 5px; 
                                margin: 20px 0; 
                            }
                            .footer { 
                                margin-top: 30px; 
                                padding-top: 20px; 
                                border-top: 1px solid #ddd; 
                                color: #666; 
                                font-size: 12px; 
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Welcome Aboard!</h1>
                            </div>
                            <div class="content">
                                <p>Hello ${context.name},</p>
                                <p>Welcome to Your App Name! We're excited to have you join our community.</p>
                                <p>Get started by completing your profile and connecting with others.</p>
                                <p style="text-align: center;">
                                    <a href="${context.dashboardUrl}" class="button">Go to Dashboard</a>
                                </p>
                            </div>
                            <div class="footer">
                                <p>This email was sent by Your App Name.</p>
                                <p>If you have any questions, contact us at support@yourapp.com</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            }
        };
    }

    // Send email with template
    async sendEmail(options) {
        try {
            const { to, subject, template, context, attachments } = options;

            let emailSubject = subject;
            let htmlContent = '';

            // Use template if provided
            if (template && this.templates[template]) {
                const templateConfig = this.templates[template];
                emailSubject = templateConfig.subject;
                htmlContent = templateConfig.html(context);
            } else {
                htmlContent = options.html || options.text || '';
            }

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"Your App" <${process.env.EMAIL_USER}>`,
                to,
                subject: emailSubject,
                html: htmlContent,
                attachments: attachments || []
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            console.error('Email send error:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    // Send plain text email
    async sendTextEmail(to, subject, text) {
        return this.sendEmail({ to, subject, text });
    }

    // Send HTML email
    async sendHtmlEmail(to, subject, html) {
        return this.sendEmail({ to, subject, html });
    }

    // Verify email configuration
    async verify() {
        try {
            await this.transporter.verify();
            return { success: true, message: 'Email server is ready' };
        } catch (error) {
            throw new Error(`Email configuration error: ${error.message}`);
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

// Export functions
const sendEmail = (options) => emailService.sendEmail(options);
const sendTextEmail = (to, subject, text) => emailService.sendTextEmail(to, subject, text);
const sendHtmlEmail = (to, subject, html) => emailService.sendHtmlEmail(to, subject, html);
const verifyEmailConfig = () => emailService.verify();

module.exports = {
    sendEmail,
    sendTextEmail,
    sendHtmlEmail,
    verifyEmailConfig,
    EmailService
};