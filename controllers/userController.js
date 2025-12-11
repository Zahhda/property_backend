const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { User, Role, Permission } = require('../models');
const { generateToken } = require('../utils/auth');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        attributes: ['name', 'description']
      }]
    });
    
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      message: 'Error fetching users',
      code: 'USER_FETCH_ERROR'
    });
  }
};

// Get user by ID
// const getUserById = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.params.id, {
//       attributes: { exclude: ['password'] },
//       include: [{
//         model: Role,
//         attributes: ['name', 'description']
//       }]
//     });
    
//     if (!user) {
//       return res.status(404).json({
//         message: 'User not found',
//         code: 'USER_NOT_FOUND'
//       });
//     }
    
//     return res.json(user);
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     return res.status(500).json({
//       message: 'Error fetching user',
//       code: 'USER_FETCH_ERROR'
//     });
//   }
// };

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'roles', // 👈 required alias to match User.belongsToMany
        attributes: ['name', 'description']
      }]
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      message: 'Error fetching user',
      code: 'USER_FETCH_ERROR'
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, mobileNumber, roleId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Check if mobile number is already in use
    const existingMobileUser = await User.findOne({ where: { mobileNumber } });
    if (existingMobileUser) {
      return res.status(400).json({
        message: 'User with this mobile number already exists',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      id: uuidv4(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      mobileNumber,
      roleId,
      status: 'active',
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    }, {
      userId: req.user.userId // For audit log
    });
    
    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    return res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      message: 'Error creating user',
      code: 'USER_CREATE_ERROR'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, roleId, status } = req.body;
    const userId = req.params.id;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Update user
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      mobileNumber: mobileNumber || user.mobileNumber,
      roleId: roleId || user.roleId,
      status: status || user.status,
      updatedBy: req.user.userId
    }, {
      userId: req.user.userId // For audit log
    });
    
    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    return res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      message: 'Error updating user',
      code: 'USER_UPDATE_ERROR'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Delete user
    await user.destroy();
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      message: 'Error deleting user',
      code: 'USER_DELETE_ERROR'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        message: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await user.update({
      password: hashedPassword,
      updatedBy: userId
    }, {
      userId // For audit log
    });
    
    return res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      message: 'Error changing password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
};

// Get user permissions
const getUserPermissions = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find user with role and permissions
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        include: [{
          model: Permission
        }]
      }]
    });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Extract permissions
    const permissions = user.Role.Permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      module: permission.module,
      action: permission.action
    }));
    
    return res.json(permissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return res.status(500).json({
      message: 'Error fetching user permissions',
      code: 'PERMISSION_FETCH_ERROR'
    });
  }
};


const updateProfile = async (req, res) => {
  try {   
    const { firstName, lastName, mobileNumber, password } = req.body;
    const userId = req.user.userId;

    // Find the logged-in user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Build update data
    const updateData = {};
    const fieldsToUpdate = [];

    if (firstName) {
      updateData.firstName = firstName;
      fieldsToUpdate.push('firstName');
    }
    if (lastName) {
      updateData.lastName = lastName;
      fieldsToUpdate.push('lastName');
    }
    if (mobileNumber) {
      updateData.mobileNumber = mobileNumber;
      fieldsToUpdate.push('mobileNumber');
    }

    // If password is provided, hash it
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
      fieldsToUpdate.push('password');
    }

    // Always track who updated
    updateData.updatedBy = userId;
    fieldsToUpdate.push('updatedBy');

    // Update only the provided fields (no validation for other required fields)
    await user.update(updateData, { fields: fieldsToUpdate });

    // Prepare response without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      message: 'Error updating profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
};


module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getUserPermissions,
  updateProfile
}; 