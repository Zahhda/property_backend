const express = require('express');
const router = express.Router();
const { PropertyWishlist, Property, User } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all wishlisted properties for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wishlists = await PropertyWishlist.findAll({
      where: { userId: req.user.userId },
      include: [{
        model: Property,
        as: 'property',
        include: [{
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }]
      }]
    });
    
    return res.json(wishlists);
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return res.status(500).json({ 
      message: 'Error fetching wishlists',
      code: 'WISHLIST_FETCH_ERROR'
    });
  }
});

// Check if a property is in user's wishlist
router.get('/check/:propertyId', authenticateToken, async (req, res) => {
  try {
    const wishlist = await PropertyWishlist.findOne({
      where: { 
        userId: req.user.userId,
        propertyId: req.params.propertyId
      }
    });
    
    return res.json({ isWishlisted: !!wishlist, wishlist });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return res.status(500).json({ 
      message: 'Error checking wishlist',
      code: 'WISHLIST_CHECK_ERROR'
    });
  }
});

// Add a property to wishlist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { propertyId, notes } = req.body;
    
    // Check if property exists
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ 
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }
    
    // Check if already in wishlist
    const existingWishlist = await PropertyWishlist.findOne({
      where: { 
        userId: req.user.userId,
        propertyId
      }
    });
    
    if (existingWishlist) {
      return res.status(400).json({ 
        message: 'Property already in wishlist',
        code: 'PROPERTY_ALREADY_WISHLISTED'
      });
    }
    
    // Create new wishlist entry
    const wishlist = await PropertyWishlist.create({
      userId: req.user.userId,
      propertyId,
      notes
    });
    
    return res.status(201).json(wishlist);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({ 
      message: 'Error adding to wishlist',
      code: 'WISHLIST_ADD_ERROR'
    });
  }
});

// Update wishlist entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { notes } = req.body;
    
    // Find the wishlist entry
    const wishlist = await PropertyWishlist.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!wishlist) {
      return res.status(404).json({ 
        message: 'Wishlist entry not found',
        code: 'WISHLIST_NOT_FOUND'
      });
    }
    
    // Update the wishlist entry
    const updatedWishlist = await wishlist.update({ notes });
    
    return res.json(updatedWishlist);
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return res.status(500).json({ 
      message: 'Error updating wishlist',
      code: 'WISHLIST_UPDATE_ERROR'
    });
  }
});

// Remove a property from wishlist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Find the wishlist entry
    const wishlist = await PropertyWishlist.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!wishlist) {
      return res.status(404).json({ 
        message: 'Wishlist entry not found',
        code: 'WISHLIST_NOT_FOUND'
      });
    }
    
    // Delete the wishlist entry
    await wishlist.destroy();
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({ 
      message: 'Error removing from wishlist',
      code: 'WISHLIST_REMOVE_ERROR'
    });
  }
});

// Admin route: Get all wishlists
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const wishlists = await PropertyWishlist.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Property,
          as: 'property'
        }
      ]
    });
    
    return res.json(wishlists);
  } catch (error) {
    console.error('Error fetching all wishlists:', error);
    return res.status(500).json({ 
      message: 'Error fetching all wishlists',
      code: 'WISHLIST_FETCH_ALL_ERROR'
    });
  }
});

module.exports = router; 