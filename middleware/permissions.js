const { User, Role, Permission, RolePermission } = require('../models');

/**
 * Cache for storing user permissions to avoid repeated database queries
 * Format: { userId: { moduleA_actionA: true, moduleB_actionB: true } }
 */
const permissionsCache = {};

/**
 * Clear the permissions cache for a specific user
 * Should be called whenever user roles or permissions change
 */
const clearUserPermissionCache = (userId) => {
  if (userId && permissionsCache[userId]) {
    delete permissionsCache[userId];
  }
};

/**
 * Clear the entire permissions cache
 * Should be called when roles or permissions are updated globally
 */
const clearAllPermissionCache = () => {
  Object.keys(permissionsCache).forEach(key => {
    delete permissionsCache[key];
  });
};

/**
 * Load permissions for a user and cache them
 */
const loadUserPermissions = async (userId) => {
  // Return from cache if available
  if (permissionsCache[userId]) {
    return permissionsCache[userId];
  }
  
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          include: [
            {
              model: Permission,
              as: 'permissions',
              where: { status: 'active' },
              required: false,
              through: { attributes: [] } // Don't include join table data
            }
          ],
          where: { status: 'active' },
          required: false,
          through: { attributes: [] } // Don't include join table data
        }
      ]
    });
    
    if (!user) {
      return {};
    }
    
    // Map permissions to a simple object for fast lookups
    const permissions = {};
    
    // Process permissions from roles
    if (user.roles && user.roles.length > 0) {
      user.roles.forEach(role => {
        if (role.permissions && role.permissions.length > 0) {
          role.permissions.forEach(permission => {
            const key = `${permission.module}_${permission.action}`;
            permissions[key] = true;
          });
        }
      });
    }
    
    // Handle special case: admin userType has all permissions
    if (user.userType === 'admin') {
      // Get all permissions from the database
      const allPermissions = await Permission.findAll({
        where: { status: 'active' }
      });
      
      allPermissions.forEach(permission => {
        const key = `${permission.module}_${permission.action}`;
        permissions[key] = true;
      });
    }
    
    // Cache the permissions
    permissionsCache[userId] = permissions;
    
    return permissions;
  } catch (error) {
    console.error('Error loading user permissions:', error);
    return {};
  }
};

/**
 * Check if a user has a specific permission
 * First tries the req.userPermissions from JWT token, then falls back to database
 */
const hasPermission = async (userId, module, action) => {
  // Try to use the permissions from the JWT token if available
  if (this.req && this.req.userPermissions) {
    const key = `${module}_${action}`;
    return !!this.req.userPermissions[key];
  }
  
  // Otherwise fetch from database
  const userPermissions = await loadUserPermissions(userId);
  return !!userPermissions[`${module}_${action}`];
};

/**
 * Middleware to check if user has permission for a specific module and action
 * Optimized to first check permissions from JWT token before querying database
 */
const requirePermission = (module, action) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      // First check if the user is admin (from JWT)
      if (req.isAdmin) {
        return next();
      }
      
      // Then check if the permission is in the JWT token
      if (req.userPermissions && req.userPermissions[`${module}_${action}`]) {
        return next();
      }
      
      // As a fallback, check the database
      const hasAccess = await hasPermission(req.user.userId, module, action);
      
      if (!hasAccess) {
        console.log(`Permission denied: ${req.user.userId} tried to access ${module}_${action}`);
        return res.status(403).json({ 
          message: 'Access denied. You do not have permission to perform this action.' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({ 
        message: 'Error checking permissions', 
        error: error.message 
      });
    }
  };
};

/**
 * Checks if a user is an admin
 * Uses isAdmin flag from JWT token for efficiency
 */
const isAdmin = (req, res, next) => {
  if (req.isAdmin || (req.user && req.user.userType === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

module.exports = {
  requirePermission,
  hasPermission,
  loadUserPermissions,
  clearUserPermissionCache,
  clearAllPermissionCache,
  isAdmin
}; 