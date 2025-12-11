const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.roleId
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiration
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiration
  });
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.refreshTokenSecret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Generate password reset token
 * @param {Object} user - User object
 * @returns {string} Password reset token
 */
const generatePasswordResetToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'password_reset'
  };

  return jwt.sign(payload, config.passwordResetSecret, {
    expiresIn: '1h' // Password reset tokens expire in 1 hour
  });
};

/**
 * Verify password reset token
 * @param {string} token - Password reset token
 * @returns {Object} Decoded token payload
 */
const verifyPasswordResetToken = (token) => {
  try {
    return jwt.verify(token, config.passwordResetSecret);
  } catch (error) {
    throw new Error('Invalid password reset token');
  }
};

/**
 * Generate email verification token
 * @param {Object} user - User object
 * @returns {string} Email verification token
 */
const generateEmailVerificationToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'email_verification'
  };

  return jwt.sign(payload, config.emailVerificationSecret, {
    expiresIn: '24h' // Email verification tokens expire in 24 hours
  });
};

/**
 * Verify email verification token
 * @param {string} token - Email verification token
 * @returns {Object} Decoded token payload
 */
const verifyEmailVerificationToken = (token) => {
  try {
    return jwt.verify(token, config.emailVerificationSecret);
  } catch (error) {
    throw new Error('Invalid email verification token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken
}; 