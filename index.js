require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('./utils/emailService');
const emailConfig = require('./config/emailConfig');
const propertyRoutes = require('./routes/property');
// const wishlistRoutes = require('./routes/wishlist');
const visitsRoutes = require('./routes/visits');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const dashboardRoutes = require('./routes/dashboardRoutes');
const wishlistRoutes = require('./routes/propertyWishlistRoutes');
const propertyViewRoutes = require('./routes/propertyViewRoutes');
const paymentsRoutes = require('./routes/payments');

const env = process.env.NODE_ENV || 'development';
const password = process.env.DB_PASSWORD; 




// Load constants from utils
const {
  PORT,
  API_PREFIX,
  JWT_SECRET,
  TOKEN_EXPIRY,
  FRONTEND_URL,
  USER_TYPES,
  USER_STATUSES,
  EMAIL_CONFIG
} = require('./utils/constants');

const app = express();

app.use(cors());


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "100mb" })); // for JSON payload
app.use(express.urlencoded({ limit: "100mb", extended: true })); // for form data

// Debug middleware to log requests
app.use((req, res, next) => {
  const { method, path, headers, body, query } = req;
  console.log(`[${new Date().toISOString()}] ${method} ${path}`);
  console.log('Headers:', JSON.stringify(headers, null, 2));

  if (Object.keys(query).length > 0) {
    console.log('Query:', JSON.stringify(query, null, 2));
  }

  if (method !== 'GET' && Object.keys(body).length > 0) {
    // Log body but redact sensitive information like passwords
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = sanitizedBody.token.substring(0, 10) + '...';
    console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
  }

  next();
});

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'property_listing_db'
});

// Import models
const db = require('./models');
const { User, Role, UserRole } = db;

// Import the permission middleware functions
const { requirePermission, clearUserPermissionCache, clearAllPermissionCache } = require('./middleware/permissions');

// Ensure PasswordResetToken model is properly loaded
let PasswordResetToken;
try {
  PasswordResetToken = db.PasswordResetToken;
  if (!PasswordResetToken) {
    console.log('PasswordResetToken not found in db object, trying to load it directly...');
    PasswordResetToken = require('./models/passwordResetToken')(sequelize, Sequelize.DataTypes);
    console.log('PasswordResetToken model loaded successfully');
  } else {
    console.log('PasswordResetToken model already loaded from db object');
  }
} catch (error) {
  console.error('Error loading PasswordResetToken model:', error);
  // Create a basic version if it doesn't exist
  console.log('Creating basic PasswordResetToken model');
  PasswordResetToken = sequelize.define('PasswordResetToken', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    token: {
      type: Sequelize.STRING,
      allowNull: false
    },
    expiresAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    used: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });
}

// Register the PasswordResetToken model in sequelize
if (!sequelize.models.PasswordResetToken) {
  console.log('Registering PasswordResetToken model with sequelize');
  sequelize.models.PasswordResetToken = PasswordResetToken;
}

// Middleware for authenticating JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Standardized route registration
app.use(`${API_PREFIX}/properties`, propertyRoutes);
app.use(`${API_PREFIX}/wishlists`, wishlistRoutes);
app.use(`${API_PREFIX}/visits`, visitsRoutes);
app.use(`${API_PREFIX}/roles`, roleRoutes);
app.use(`${API_PREFIX}/permissions`, permissionRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/payments`, paymentsRoutes);

// Generate a secure random token
function generateResetToken() {
  return crypto.randomBytes(40).toString('hex');
}

// Forgot Password endpoint
app.post(`${API_PREFIX}/auth/forgot-password`, async (req, res) => {
  try {
    console.log('Forgot password request received:', JSON.stringify(req.body));
    const { email } = req.body;

    if (!email) {
      console.log('Email is missing in request');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('User not found for email:', email);
      // For security reasons, don't reveal that the email doesn't exist
      return res.status(200).json({
        message: 'If your email is registered, you will receive a password reset link shortly.'
      });
    }

    console.log('User found:', user.id);

    // Generate a secure token
    const resetToken = generateResetToken();
    console.log('Generated reset token (first 10 chars):', resetToken.substring(0, 10) + '...');

    // Calculate expiry time (default: 1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + emailConfig.resetTokenExpiryHours);
    console.log('Token expires at:', expiresAt);

    // Store the token in the database
    try {
      const createdToken = await sequelize.models.PasswordResetToken.create({
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false
      });
      console.log('Token stored in database with ID:', createdToken.id);
    } catch (error) {
      console.error('Error creating password reset token:', error);
      return res.status(500).json({ message: 'Error processing your request' });
    }

    // Create reset URL
    const resetUrl = `${emailConfig.resetPasswordUrl}?token=${resetToken}`;
    console.log('Reset URL created:', resetUrl);

    // Send the password reset email
    const userData = user.toJSON();
    delete userData.password;

    try {
      console.log('Attempting to send password reset email to:', email);
      const emailResult = await sendPasswordResetEmail(userData, resetToken, resetUrl);

      const emailSent = emailResult && !emailResult.error;

      if (!emailSent) {
        console.error('Failed to send password reset email:', emailResult?.message);
        return res.status(500).json({ message: 'Failed to send password reset email' });
      }

      console.log('Password reset email sent successfully');
      res.status(200).json({
        message: 'If your email is registered, you will receive a password reset link shortly.'
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      res.status(500).json({ message: 'Error sending password reset email' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'An error occurred processing your request',
      error: error.message
    });
  }
});

// Verify reset token endpoint
app.get(`${API_PREFIX}/auth/verify-reset-token`, async (req, res) => {
  try {
    console.log('Verify token request received with query:', JSON.stringify(req.query));

    // Get token from query or body
    const token = req.query.token || (req.body && req.body.token);

    console.log('Token present:', !!token);

    if (!token) {
      console.log('Token is missing in the request');
      return res.status(400).json({ message: 'Token is required', valid: false });
    }

    // Find the token in the database
    console.log('Looking for token in database');
    const resetToken = await sequelize.models.PasswordResetToken.findOne({
      where: {
        token,
        used: false,
        expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } // Token must not be expired
      }
    });

    if (!resetToken) {
      console.log('Token not found or invalid:', token.substring(0, 10) + '...');
      return res.status(400).json({
        message: 'Invalid or expired token',
        valid: false
      });
    }

    console.log('Valid token found, expires at:', resetToken.expiresAt);

    // Find user associated with the token
    const user = await User.findByPk(resetToken.userId);

    if (!user) {
      console.log('User not found for token userId:', resetToken.userId);
      return res.status(400).json({
        message: 'User not found',
        valid: false
      });
    }

    console.log('Token verified successfully for user:', user.email);
    res.status(200).json({
      message: 'Token is valid',
      valid: true,
      email: user.email
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      message: 'Error verifying token',
      valid: false,
      error: error.message
    });
  }
});

// Reset password endpoint
app.post(`${API_PREFIX}/auth/reset-password`, async (req, res) => {
  try {
    console.log('Reset password request received with content type:', req.headers['content-type']);

    // Handle different content types
    let token, password;

    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      // JSON format
      console.log('Processing JSON request');
      token = req.body.token;
      password = req.body.password;
    } else if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
      // Form data
      console.log('Processing form-urlencoded request');
      token = req.body.token;
      password = req.body.password;
    } else {
      // Try to handle it anyway
      console.log('Unknown content type, attempting to process anyway');
      token = req.body.token || req.query.token;
      password = req.body.password;
    }

    console.log('Token present:', !!token, 'Password present:', !!password);

    if (!token || !password) {
      return res.status(400).json({
        message: 'Token and password are required',
        debug: { tokenProvided: !!token, passwordProvided: !!password }
      });
    }

    // Find the token in the database
    const resetToken = await sequelize.models.PasswordResetToken.findOne({
      where: {
        token,
        used: false,
        expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } // Token must not be expired
      }
    });

    if (!resetToken) {
      console.log('Invalid token or token not found in database');
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    console.log('Valid token found for user ID:', resetToken.userId);

    // Find user associated with the token
    const user = await User.findByPk(resetToken.userId);

    if (!user) {
      console.log('User not found for token userId:', resetToken.userId);
      return res.status(400).json({ message: 'User not found' });
    }

    console.log('User found, resetting password for:', user.email);

    // Update the user's password
    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });

    // Mark the token as used
    await resetToken.update({ used: true });

    console.log('Password reset successful for user:', user.email);
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Error resetting password',
      error: error.message
    });
  }
});

// Signup endpoint
app.post(`${API_PREFIX}/auth/signup`, async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNumber, password, userType } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if this is the first user (to be set as admin)
    const userCount = await User.count();
    const isFirstUser = userCount === 0;

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobileNumber,
      password,
      userType: userType || USER_TYPES.USER,
      status: USER_STATUSES.ACTIVE,
    });


    // Update the user with created/updated by (for first user, self-reference)
    await user.update({
      createdBy: user.id,
      updatedBy: user.id
    });

    // Try to create audit log entry if AuditLog model exists
    try {
      if (sequelize.models.AuditLog) {
        await sequelize.models.AuditLog.create({
          entityType: 'User',
          entityId: user.id,
          action: 'CREATE',
          newValue: {
            ...user.toJSON(),
            password: '[REDACTED]'
          },
          createdBy: user.id
        });
      }
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Continue with user creation even if audit log fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const userData = user.toJSON();
    delete userData.password;

    // Send welcome email
    if (EMAIL_CONFIG.debug) {
      console.log('Attempting to send welcome email...');
    }

    let emailResult = null;
    try {
      emailResult = await sendWelcomeEmail(userData, password);

      if (EMAIL_CONFIG.debug) {
        console.log('Email sending completed with result:', emailResult.messageId ? 'Success' : 'Failed');
      }
    } catch (emailError) {
      console.error('Failed to send welcome email (caught in server):', emailError);
      emailResult = { error: true, message: emailError.message };
      // Continue with registration process even if email fails
    }

    // Check if email sending returned an error object
    const emailSent = emailResult && !emailResult.error;
    const emailErrorMsg = !emailSent ? (emailResult?.message || 'Unknown email error') : null;

    if (!emailSent && EMAIL_CONFIG.debug) {
      console.log('Email sending failed with message:', emailErrorMsg);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token,
      emailSent,
      emailError: emailErrorMsg
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Add this new endpoint for email checking
app.get(`${API_PREFIX}/auth/check-email`, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await sequelize.models.User.findOne({
      where: { email },
      attributes: ['id'] // Only fetch the id field for performance
    });

    res.json({
      exists: !!existingUser
    });

  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      message: 'Error checking email',
      error: error.message
    });
  }
});

// Login endpoint
app.post(`${API_PREFIX}/auth/login`, async (req, res) => {
  try {
    console.log(req.body); return;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: db.Role,
          as: 'roles',
          through: { attributes: [] },
          include: [
            {
              model: db.Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== USER_STATUSES.ACTIVE) {
      return res.status(403).json({ message: 'Your account is inactive or suspended' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Extract permissions from roles for the token
    let userPermissions = {};

    if (user.roles && user.roles.length > 0) {
      user.roles.forEach(role => {
        if (role.permissions && role.permissions.length > 0) {
          role.permissions.forEach(permission => {
            const key = `${permission.module}_${permission.action}`;
            userPermissions[key] = true;
          });
        }
      });
    }

    // If user is admin, add special admin flag
    let isAdmin = user.userType === USER_TYPES.ADMIN;

    // Generate JWT token with permissions
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        isAdmin,
        userPermissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const userData = user.toJSON();
    delete userData.password;

    res.status(200).json({
      message: 'Login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error during login',
      error: error.message
    });
  }
});

// ADMIN USER MANAGEMENT ENDPOINTS

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.userType === USER_TYPES.ADMIN || req.user.userType === USER_TYPES.SUPER_ADMIN)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

// Get all users (admin only)
app.get(`${API_PREFIX}/admin/users`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    // Add role information to each user
    const userRoles = await UserRole.findAll();

    const usersWithRoles = await Promise.all(users.map(async (user) => {
      const userData = user.toJSON();

      // Find user's role if exists
      const userRole = userRoles.find(ur => ur.userId === user.id);
      if (userRole) {
        userData.roleId = userRole.roleId;
      }

      return userData;
    }));

    res.status(200).json(usersWithRoles);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user by ID (admin only)
app.get(`${API_PREFIX}/admin/users/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Create user (admin only)
app.post(`${API_PREFIX}/admin/users`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNumber, password, roleId, status } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if role exists
    let userType = USER_TYPES.USER; // Default user type

    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({ message: 'Invalid role ID' });
      }

      // Set userType based on role name
      // This maintains backward compatibility while transitioning to full role-based system
      if (role.name.toLowerCase().includes('admin')) {
        userType = USER_TYPES.ADMIN;
      } else if (role.name.toLowerCase().includes('property') && role.name.toLowerCase().includes('owner')) {
        userType = USER_TYPES.PROPERTY_OWNER;
      }
    }

    // Store original password for email
    const originalPassword = password;

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobileNumber,
      password, // Will be hashed by the beforeCreate hook
      userType, // Set based on role or default
      status: status || USER_STATUSES.ACTIVE,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    // Assign role if provided
    if (roleId) {
      try {
        await UserRole.create({
          id: uuidv4(),
          userId: user.id,
          roleId: roleId,
          createdBy: req.user.userId
        });
      } catch (roleError) {
        console.error('Error assigning role to user:', roleError);
        // Continue with user creation even if role assignment fails
      }
    }

    // Return user data (without password)
    const userData = user.toJSON();
    delete userData.password;

    // Add roleId to the user data for frontend
    if (roleId) {
      userData.roleId = roleId;
    }

    // Send welcome email with login credentials
    if (EMAIL_CONFIG.debug) {
      console.log('Attempting to send welcome email with credentials...');
    }

    let emailResult = null;
    try {
      emailResult = await sendWelcomeEmail(userData, originalPassword);

      if (EMAIL_CONFIG.debug) {
        console.log('Email sending completed with result:', emailResult.messageId ? 'Success' : 'Failed');
      }
    } catch (emailError) {
      console.error('Failed to send welcome email (caught in server):', emailError);
      emailResult = { error: true, message: emailError.message };
      // Continue with user creation process even if email fails
    }

    // Check if email sending returned an error object
    const emailSent = emailResult && !emailResult.error;
    const emailErrorMsg = !emailSent ? (emailResult?.message || 'Unknown email error') : null;

    if (!emailSent && EMAIL_CONFIG.debug) {
      console.log('Email sending failed with message:', emailErrorMsg);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: userData,
      emailSent,
      emailError: emailErrorMsg
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Update user (admin only)
app.put(`${API_PREFIX}/admin/users/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNumber, roleId, status } = req.body;
    const userId = req.params.id;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
    }

    // Check if role exists and update userType if needed
    let userType = user.userType; // Default to current user type

    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({ message: 'Invalid role ID' });
      }

      // Update userType based on role name
      // This maintains backward compatibility while transitioning to full role-based system
      if (role.name.toLowerCase().includes('admin')) {
        userType = USER_TYPES.ADMIN;
      } else if (role.name.toLowerCase().includes('property') && role.name.toLowerCase().includes('owner')) {
        userType = USER_TYPES.PROPERTY_OWNER;
      } else {
        userType = USER_TYPES.USER;
      }
    }

    // Update user
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      mobileNumber: mobileNumber || user.mobileNumber,
      userType: userType, // Update based on role
      status: status || user.status,
      updatedBy: req.user.userId
    }, {
      userId: req.user.userId // Pass userId for audit log
    });

    // Update role if provided
    if (roleId) {
      try {
        // Check if user already has this role
        const existingUserRole = await UserRole.findOne({
          where: { userId, roleId }
        });

        if (!existingUserRole) {
          // Remove any existing roles
          await UserRole.destroy({ where: { userId } });

          // Assign new role
          await UserRole.create({
            id: uuidv4(),
            userId,
            roleId,
            createdBy: req.user.userId
          });

          // Clear permission cache for this user
          clearUserPermissionCache(userId);
        }
      } catch (roleError) {
        console.error('Error updating user role:', roleError);
        // Continue with user update even if role update fails
      }
    }

    // Return updated user data (without password)
    const userData = user.toJSON();
    delete userData.password;

    // Add roleId to the user data
    if (roleId) {
      userData.roleId = roleId;
    } else {
      // Get current role for the user if exists
      const userRole = await UserRole.findOne({ where: { userId } });
      if (userRole) {
        userData.roleId = userRole.roleId;
      }
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user (admin only)
app.delete(`${API_PREFIX}/admin/users/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is trying to delete their own account
    if (user.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Handle foreign key constraint - update any users referencing this user
    await User.update(
      { createdBy: null },
      { where: { createdBy: userId } }
    );

    await User.update(
      { updatedBy: null },
      { where: { updatedBy: userId } }
    );

    // Delete the user
    await user.destroy();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Reset user password (admin only)
app.post(`${API_PREFIX}/admin/users/:id/reset-password`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await user.update({
      password: hashedPassword,
      updatedBy: req.user.userId
    }, {
      userId: req.user.userId
    });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      message: 'Error resetting password',
      error: error.message
    });
  }
});

// Get user status options (for dropdown)
app.get(`${API_PREFIX}/user-statuses`, authenticateToken, async (req, res) => {
  try {
    // Return status values with display information
    const statuses = [
      {
        value: USER_STATUSES.ACTIVE,
        label: 'Active',
        colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      },
      {
        value: USER_STATUSES.INACTIVE,
        label: 'Inactive',
        colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      },
      {
        value: USER_STATUSES.SUSPENDED,
        label: 'Suspended',
        colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      }
    ];

    res.status(200).json(statuses);
  } catch (error) {
    console.error('Error fetching user statuses:', error);
    res.status(500).json({
      message: 'Error fetching user statuses',
      error: error.message
    });
  }
});


app.use('/api', dashboardRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', propertyViewRoutes);


// Create email transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on port 3001');
});