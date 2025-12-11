const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Role, Permission, RolePermission, UserRole, User } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { requirePermission, clearUserPermissionCache, clearAllPermissionCache } = require('../middleware/permissions');

const router = express.Router();

// Get all roles
router.get('/', authenticateToken, requirePermission('role_permission', 'view'), async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ],
      order: [['name', 'ASC']]
    });
    
    return res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({ 
      message: 'Error fetching roles',
      code: 'ROLE_FETCH_ERROR'
    });
  }
});

// Get role by ID
router.get('/:id', authenticateToken, requirePermission('role_permission', 'view'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!role) {
      return res.status(404).json({ 
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }
    
    return res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return res.status(500).json({ 
      message: 'Error fetching role',
      code: 'ROLE_FETCH_ERROR'
    });
  }
});

// Create new role
router.post('/', authenticateToken, requirePermission('role_permission', 'create'), async (req, res) => {
  try {
    const { name, description, permissions, colorClass } = req.body;
    
    // Check if role name already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ 
        message: 'Role name already exists',
        code: 'ROLE_NAME_EXISTS'
      });
    }
    
    // Create role
    const role = await Role.create({
      id: uuidv4(),
      name,
      description,
      colorClass,
      isSystem: false,
      status: 'active',
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    }, {
      userId: req.user.userId // For audit log
    });
    
    // Add permissions if provided
    if (permissions && permissions.length > 0) {
      const rolePermissions = permissions.map(permissionId => ({
        id: uuidv4(),
        roleId: role.id,
        permissionId,
        createdBy: req.user.userId
      }));
      
      await RolePermission.bulkCreate(rolePermissions);
      
      // Clear permission cache
      clearAllPermissionCache();
    }
    
    // Return the created role with permissions
    const createdRole = await Role.findByPk(role.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });
    
    return res.status(201).json(createdRole);
  } catch (error) {
    console.error('Error creating role:', error);
    return res.status(500).json({ 
      message: 'Error creating role',
      code: 'ROLE_CREATE_ERROR'
    });
  }
});

// Update role
router.put('/:id', authenticateToken, requirePermission('role_permission', 'update'), async (req, res) => {
  try {
    const { name, description, status, permissions, colorClass } = req.body;
    const roleId = req.params.id;
    
    // Find the role
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ 
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }
    
    // Prevent updating system roles (except for permissions)
    if (role.isSystem && (name !== role.name || description !== role.description)) {
      return res.status(403).json({ 
        message: 'System roles cannot be modified',
        code: 'SYSTEM_ROLE_MODIFICATION'
      });
    }
    
    // Check if new name already exists (if name is being changed)
    if (name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({ 
          message: 'Role name already exists',
          code: 'ROLE_NAME_EXISTS'
        });
      }
    }
    
    // Update role
    await role.update({
      name: name || role.name,
      description: description || role.description,
      colorClass: colorClass !== undefined ? colorClass : role.colorClass,
      status: status || role.status,
      updatedBy: req.user.userId
    }, {
      userId: req.user.userId // For audit log
    });
    
    // Update permissions if provided
    if (permissions) {
      // Delete existing permissions
      await RolePermission.destroy({ where: { roleId } });
      
      // Add new permissions
      if (permissions.length > 0) {
        const rolePermissions = permissions.map(permissionId => ({
          id: uuidv4(),
          roleId,
          permissionId,
          createdBy: req.user.userId
        }));
        
        await RolePermission.bulkCreate(rolePermissions);
      }
      
      // Clear permission cache for all users with this role
      const userRoles = await UserRole.findAll({ where: { roleId } });
      userRoles.forEach(userRole => {
        clearUserPermissionCache(userRole.userId);
      });
    }
    
    // Return updated role with permissions
    const updatedRole = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });
    
    return res.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ 
      message: 'Error updating role',
      code: 'ROLE_UPDATE_ERROR'
    });
  }
});

// Delete role
router.delete('/:id', authenticateToken, requirePermission('role_permission', 'delete'), async (req, res) => {
  try {
    const roleId = req.params.id;
    
    // Find the role
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ 
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }
    
    // Prevent deleting system roles
    if (role.isSystem) {
      return res.status(403).json({ 
        message: 'System roles cannot be deleted',
        code: 'SYSTEM_ROLE_DELETION'
      });
    }
    
    // Check if role is assigned to any users
    const userRoleCount = await UserRole.count({ where: { roleId } });
    if (userRoleCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role that is assigned to users',
        code: 'ROLE_IN_USE'
      });
    }
    
    // Delete role permissions
    await RolePermission.destroy({ where: { roleId } });
    
    // Delete role
    await role.destroy();
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({ 
      message: 'Error deleting role',
      code: 'ROLE_DELETE_ERROR'
    });
  }
});

// Assign role to user
router.post('/assign', authenticateToken, requirePermission('role_permission', 'assign'), async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ 
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check if role is already assigned
    const existingAssignment = await UserRole.findOne({
      where: { userId, roleId }
    });
    
    if (existingAssignment) {
      return res.status(400).json({ 
        message: 'Role is already assigned to user',
        code: 'ROLE_ALREADY_ASSIGNED'
      });
    }
    
    // Assign role
    await UserRole.create({
      id: uuidv4(),
      userId,
      roleId,
      createdBy: req.user.userId
    });
    
    // Clear user's permission cache
    clearUserPermissionCache(userId);
    
    return res.status(201).json({ 
      message: 'Role assigned successfully',
      code: 'ROLE_ASSIGNED'
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    return res.status(500).json({ 
      message: 'Error assigning role',
      code: 'ROLE_ASSIGN_ERROR'
    });
  }
});

// Remove role from user
router.delete('/assign/:userId/:roleId', authenticateToken, requirePermission('role_permission', 'assign'), async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    
    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ 
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check if role is assigned
    const assignment = await UserRole.findOne({
      where: { userId, roleId }
    });
    
    if (!assignment) {
      return res.status(404).json({ 
        message: 'Role is not assigned to user',
        code: 'ROLE_NOT_ASSIGNED'
      });
    }
    
    // Remove role
    await assignment.destroy();
    
    // Clear user's permission cache
    clearUserPermissionCache(userId);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error removing role:', error);
    return res.status(500).json({ 
      message: 'Error removing role',
      code: 'ROLE_REMOVE_ERROR'
    });
  }
});

// Get user roles
router.get('/user/:userId', authenticateToken, requirePermission('role_permission', 'view'), async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user roles
    const roles = await Role.findAll({
      include: [
        {
          model: User,
          as: 'users',
          where: { id: userId },
          through: { attributes: [] },
          required: true
        }
      ]
    });
    
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ 
      message: 'Error fetching user roles', 
      error: error.message 
    });
  }
});

// Get all roles with user counts
router.get('/with-user-counts', authenticateToken, requirePermission('role_permission', 'view'), async (req, res) => {
  try {
    // Get all roles
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ],
      order: [['name', 'ASC']]
    });

    // Get user counts for each role
    const roleCounts = await Promise.all(
      roles.map(async (role) => {
        const count = await UserRole.count({
          where: { roleId: role.id }
        });

        return {
          ...role.toJSON(),
          userCount: count
        };
      })
    );
    
    res.status(200).json(roleCounts);
  } catch (error) {
    console.error('Error fetching roles with user counts:', error);
    res.status(500).json({ 
      message: 'Error fetching roles with user counts', 
      error: error.message 
    });
  }
});

module.exports = router; 