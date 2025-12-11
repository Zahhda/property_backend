/**
 * Application Constants
 * Values are loaded from environment variables with fallbacks
 */

// Server Configuration
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api';
// Database Configuration
const DB_CONFIG = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_DIALECT || 'mysql'
};

// Authentication
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '7d';
const PASSWORD_RESET_EXPIRY = process.env.PASSWORD_RESET_EXPIRY || '24h';

// Frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// User Types
const USER_TYPES = {
  ADMIN: process.env.USER_TYPE_ADMIN || 'admin',
  SUPER_ADMIN: process.env.USER_TYPE_SUPER_ADMIN || 'super_admin',
  PROPERTY_OWNER: process.env.USER_TYPE_PROPERTY_OWNER || 'property_listing',
  USER: process.env.USER_TYPE_USER || 'property_searching'
};

// User Statuses
const USER_STATUSES = {
  ACTIVE: process.env.USER_STATUS_ACTIVE || 'active',
  INACTIVE: process.env.USER_STATUS_INACTIVE || 'inactive',
  SUSPENDED: process.env.USER_STATUS_SUSPENDED || 'suspended'
};

// Email Configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  domain: process.env.EMAIL_DOMAIN,
  senderName: process.env.EMAIL_SENDER_NAME || 'Property Listing',
  supportEmail: process.env.EMAIL_SUPPORT,
  welcomeSubject: process.env.EMAIL_WELCOME_SUBJECT || 'Welcome to Property Listing',
  debug: process.env.EMAIL_DEBUG === 'true',
  testEmail: process.env.TEST_EMAIL
};

module.exports = {
  PORT,
  API_PREFIX,
  DB_CONFIG,
  JWT_SECRET,
  TOKEN_EXPIRY,
  PASSWORD_RESET_EXPIRY,
  FRONTEND_URL,
  USER_TYPES,
  USER_STATUSES,
  EMAIL_CONFIG
}; 