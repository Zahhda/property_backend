const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/constants');

/**
 * Middleware for authenticating JWT tokens
 * Extracts the JWT token from the Authorization header, verifies it,
 * and attaches the decoded user object to the request.
 * Now includes user permissions and isAdmin flag for easier access.
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication token required',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            message: 'Token has expired',
            code: 'TOKEN_EXPIRED'
          });
        }
        return res.status(403).json({ 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }

      // Add user info to request
      req.user = decoded;
      
      // For convenience, attach specific permissions data
      req.userPermissions = decoded.userPermissions || {};
      req.isAdmin = decoded.isAdmin || false;
      
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      message: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.userType !== 'admin' && req.user.userType !== 'super_admin') {
    return res.status(403).json({ 
      message: 'Admin privileges required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  isAdmin
}; 