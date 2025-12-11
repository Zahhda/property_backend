require('dotenv').config();
// Email configuration constants loaded from environment variables
const emailConfig = {
  // SMTP Server Configuration
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },

  // Sender Information
  senderDomain: process.env.EMAIL_DOMAIN || 'property-listing.com',
  senderName: process.env.EMAIL_SENDER_NAME || 'Property Listing',
  supportEmail: process.env.EMAIL_SUPPORT || 'support@dorpay.in',
  
  // Email Content
  welcomeSubject: process.env.EMAIL_WELCOME_SUBJECT || 'Welcome to Property Listing - Registration Successful',
  resetPasswordSubject: process.env.EMAIL_RESET_SUBJECT || 'Password Reset Request',
  
  // URLs
  loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login`,
  resetPasswordUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`,
  
  // Token Settings
  resetTokenExpiryHours: parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS || '1'),
  
  // Debug Settings
  debug: process.env.EMAIL_DEBUG === 'true'
};

module.exports = emailConfig; 