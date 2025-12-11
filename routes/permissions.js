const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Permission } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { requirePermission, clearAllPermissionCache } = require('../middleware/permissions');

const router = express.Router();

// Get all permissions
router.get('/', authenticateToken, requirePermission('role_permission', 'view'), async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [
        ['module', 'ASC'],
        ['action', 'ASC']
      ]
    });
    
    return res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({ 
      message: 'Error fetching permissions',
      code: 'PERMISSION_FETCH_ERROR'
    });
  }
});

// Get permissions by module
router.get('/module/:module', authenticateToken, requirePermission('role_permission', 'view'), async (req, res) => {
  try {
    const module = req.params.module;
    
    const permissions = await Permission.findAll({
      where: { module },
      order: [['action', 'ASC']]
    });
    
    return res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions by module:', error);
    return res.status(500).json({ 
      message: 'Error fetching permissions by module',
      code: 'PERMISSION_FETCH_ERROR'
    });
  }
});

// Get permission by ID
router.get('/:id', authenticateToken, requirePermission('role_permission', 'view'), async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ 
        message: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }
    
    return res.json(permission);
  } catch (error) {
    console.error('Error fetching permission:', error);
    return res.status(500).json({ 
      message: 'Error fetching permission',
      code: 'PERMISSION_FETCH_ERROR'
    });
  }
});

// Create new permission
router.post('/', authenticateToken, requirePermission('role_permission', 'create'), async (req, res) => {
  try {
    const { name, module, action, description } = req.body;
    
    // Validate required fields
    if (!name || !module || !action) {
      return res.status(400).json({ 
        message: 'Name, module, and action are required',
        code: 'PERMISSION_MISSING_FIELDS'
      });
    }
    
    // Check if permission already exists
    const existingPermission = await Permission.findOne({ where: { module, action } });
    if (existingPermission) {
      return res.status(400).json({ 
        message: 'Permission with this module and action already exists',
        code: 'PERMISSION_ALREADY_EXISTS'
      });
    }
    
    // Create permission
    const permission = await Permission.create({
      id: uuidv4(),
      name,
      module,
      action,
      description,
      isSystem: false,
      status: 'active',
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    }, {
      userId: req.user.userId // For audit log
    });
    
    // Clear permission cache
    clearAllPermissionCache();
    
    return res.status(201).json(permission);
  } catch (error) {
    console.error('Error creating permission:', error);
    return res.status(500).json({ 
      message: 'Error creating permission',
      code: 'PERMISSION_CREATE_ERROR'
    });
  }
});

// Update permission
router.put('/:id', authenticateToken, requirePermission('role_permission', 'update'), async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const permissionId = req.params.id;
    
    // Find the permission
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ 
        message: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }
    
    // Prevent updating module and action for system permissions
    if (permission.isSystem) {
      return res.status(403).json({ 
        message: 'System permissions cannot be modified',
        code: 'SYSTEM_PERMISSION_MODIFICATION'
      });
    }
    
    // Update permission
    await permission.update({
      name: name || permission.name,
      description: description || permission.description,
      status: status || permission.status,
      updatedBy: req.user.userId
    }, {
      userId: req.user.userId // For audit log
    });
    
    // Clear permission cache
    clearAllPermissionCache();
    
    return res.json(permission);
  } catch (error) {
    console.error('Error updating permission:', error);
    return res.status(500).json({ 
      message: 'Error updating permission',
      code: 'PERMISSION_UPDATE_ERROR'
    });
  }
});

// Delete permission
router.delete('/:id', authenticateToken, requirePermission('role_permission', 'delete'), async (req, res) => {
  try {
    const permissionId = req.params.id;
    
    // Find the permission
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({ 
        message: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }
    
    // Prevent deleting system permissions
    if (permission.isSystem) {
      return res.status(403).json({ 
        message: 'System permissions cannot be deleted',
        code: 'SYSTEM_PERMISSION_DELETION'
      });
    }
    
    // Delete permission
    await permission.destroy();
    
    // Clear permission cache
    clearAllPermissionCache();
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting permission:', error);
    return res.status(500).json({ 
      message: 'Error deleting permission',
      code: 'PERMISSION_DELETE_ERROR'
    });
  }
});

// Get all unique modules
router.get('/modules/all', authenticateToken, requirePermission('role_permission', 'view'), async (req, res) => {
  try {
    const modules = await Permission.findAll({
      attributes: ['module'],
      group: ['module'],
      order: [['module', 'ASC']]
    });
    
    // Extract just the module names
    const moduleNames = modules.map(m => m.module);
    
    return res.json(moduleNames);
  } catch (error) {
    console.error('Error fetching modules:', error);
    return res.status(500).json({ 
      message: 'Error fetching modules',
      code: 'MODULE_FETCH_ERROR'
    });
  }
});

module.exports = router; 