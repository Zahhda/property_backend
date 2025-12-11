const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const PasswordReset = require('../models/PasswordReset');
const emailService = require('../utils/emailService');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'qwertyjknbvcsawertghjki876543234567890pmnbvcder5yhj';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Login controller
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account is not active. Please contact support.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.roleId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return user data and token
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleId: user.roleId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Register controller
 */
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNumber, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists',
        errors: [{ field: 'email', message: 'Email is already in use' }]
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get default role (usually 'user' role)
    const defaultRoleId = req.body.roleId || 'user-role-id'; // Replace with default role ID from your system

    // Create new user
    const newUser = await User.create({
      id: uuidv4(),
      firstName,
      lastName,
      email,
      mobileNumber,
      password: hashedPassword,
      roleId: defaultRoleId,
      status: 'active'
    });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * Forgot password controller
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // For security reasons, always return success even if user doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'If your email is registered, you will receive password reset instructions'
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token
    await PasswordReset.create({
      id: uuidv4(),
      userId: user.id,
      token: resetToken,
      expiresAt: resetTokenExpiry
    });

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendPasswordResetEmail(user.email, resetLink);

    res.status(200).json({
      status: 'success',
      message: 'If your email is registered, you will receive password reset instructions'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * Reset password controller
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find the reset token
    const resetRecord = await PasswordReset.findOne({
      where: {
        token,
        expiresAt: { $gt: new Date() } // Token not expired
      }
    });

    if (!resetRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await User.update(
      { password: hashedPassword },
      { where: { id: resetRecord.userId } }
    );

    // Delete the used token
    await PasswordReset.destroy({ where: { id: resetRecord.id } });

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while resetting your password'
    });
  }
};

/**
 * Verify JWT token
 */
exports.verifyToken = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({
      status: 'success',
      message: 'Token is valid',
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
}; 