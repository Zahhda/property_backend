const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createUserSchema, updateUserSchema, resetPasswordSchema } = require('../middleware/validation');
const userController = require('../controllers/userController');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);

// Get user by ID
router.get('/:id', authenticateToken, userController.getUserById);

// Create new user (admin only)
router.post('/', 
  authenticateToken, 
  isAdmin, 
  validate(createUserSchema), 
  userController.createUser
);

// Update user
router.put('/:id', 
  authenticateToken, 
  validate(updateUserSchema), 
  userController.updateUser
);

// Delete user (admin only)
router.delete('/:id', 
  authenticateToken, 
  isAdmin, 
  userController.deleteUser
);

// Change password
router.post('/change-password', 
  authenticateToken, 
  validate(resetPasswordSchema), 
  userController.changePassword
);

// Get user permissions
router.get('/:id/permissions', 
  authenticateToken, 
  userController.getUserPermissions
);

// Update current user's profile
router.put('/profile', 
  authenticateToken, 
  // validate(updateUserSchema), // reuse same schema as update user
  userController.updateProfile
);

module.exports = router;
