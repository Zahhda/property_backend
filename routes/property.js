const express = require('express');
const router = express.Router();
const { Property, User } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// Middleware to check if user is property owner or admin
const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const propertyId = req.params.id;
    const property = await Property.findByPk(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check if user is admin or the owner of the property
    if (req.user.userType === 'admin' || req.user.userType === 'super_admin' || 
        property.ownerId === req.user.id) {
      req.property = property;
      return next();
    }
    return res.status(403).json({ message: 'Access denied. You do not have permission to perform this action.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all properties with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const properties = await Property.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.json({
      properties: properties.rows,
      total: properties.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(properties.count / limit)
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ 
      message: 'Error fetching properties',
      code: 'PROPERTY_FETCH_ERROR'
    });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!property) {
      return res.status(404).json({ 
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ 
      message: 'Error fetching property',
      code: 'PROPERTY_FETCH_ERROR'
    });
  }
});

// Create new property (requires authentication)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      ownerId: req.user.userId
    };

    const property = await Property.create(propertyData);
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ 
      message: 'Error creating property',
      code: 'PROPERTY_CREATE_ERROR'
    });
  }
});

// Update property (requires authentication and ownership or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ 
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }
    console.log(req.user.userType);
    
    // Check if user is owner or admin
    if (property.ownerId !== req.user.userId && req.user.userType !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to update this property',
        code: 'UPDATE_NOT_AUTHORIZED'
      });
    }

    await property.update(req.body);
    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ 
      message: 'Error updating property',
      code: 'PROPERTY_UPDATE_ERROR'
    });
  }
});

// Delete property (requires authentication and ownership or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    // console.log(req.user); 
    if (!property) {
      return res.status(404).json({ 
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Allow if user is owner OR admin
    if (property.ownerId !== req.user.userId && req.user.userType !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to delete this property',
        code: 'DELETE_NOT_AUTHORIZED'
      });
    }

    await property.destroy();
    return res.status(204).send();

  } catch (error) {
    console.error('Error deleting property:', error);
    return res.status(500).json({ 
      message: 'Error deleting property',
      code: 'PROPERTY_DELETE_ERROR'
    });
  }
});



// Admin routes

// Get all properties (admin only, including inactive/sold ones)
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const properties = await Property.findAll({
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'mobileNumber', 'userType']
      }],
      order: [['updatedAt', 'DESC']]
    });
    return res.json(properties);
  } catch (error) {
    console.error('Error fetching admin properties:', error);
    return res.status(500).json({ 
      message: 'Server error fetching properties', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =====================
// Filter properties API
// =====================
router.post('/filter', async (req, res) => {
  console.log('asdfasf');
  try {
    const {
      property_type,
      price_start,
      price_end,
      bedrooms,
      min_area,
      max_area,
      search_query,
      location,
      page = 1,
      limit = 10
    } = req.body;

    const whereClause = {};
    const offset = (page - 1) * limit;

    // Property type
    if (property_type) {
      whereClause.propertyType = property_type;
    }

    // Price range
    if (price_start && price_end) {
      whereClause.price = { [Op.between]: [Number(price_start), Number(price_end)] };
    } else if (price_start) {
      whereClause.price = { [Op.gte]: Number(price_start) };
    } else if (price_end) {
      whereClause.price = { [Op.lte]: Number(price_end) };
    }

    // Bedrooms (flatType or numRooms)
    if (bedrooms) {
      whereClause[Op.or] = [
        { flatType: `${bedrooms}BHK` },
        { numRooms: Number(bedrooms) }
      ];
    }

    // Area range
    if (min_area && max_area) {
      whereClause.totalArea = { [Op.between]: [Number(min_area), Number(max_area)] };
    } else if (min_area) {
      whereClause.totalArea = { [Op.gte]: Number(min_area) };
    } else if (max_area) {
      whereClause.totalArea = { [Op.lte]: Number(max_area) };
    }

    // Search query
    if (search_query) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search_query}%` } },
        { description: { [Op.like]: `%${search_query}%` } },
        { address: { [Op.like]: `%${search_query}%` } }
      ];
    }

    // Location (city/state)
    if (location) {
      whereClause[Op.or] = [
        { city: { [Op.like]: `%${location}%` } },
        { state: { [Op.like]: `%${location}%` } }
      ];
    }

    // Fetch filtered properties
    const properties = await Property.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    return res.json({
      success: true,
      total: properties.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(properties.count / limit),
      data: properties.rows
    });

  } catch (error) {
    console.error('Error filtering properties:', error);
    return res.status(500).json({
      success: false,
      message: 'Error filtering properties',
      error: error.message
    });
  }
});

module.exports = router; 