const express = require('express');
const router = express.Router();
const { PropertyVisit, Property, User } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all visits for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const visits = await PropertyVisit.findAll({
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
    
    return res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return res.status(500).json({ 
      message: 'Error fetching visits',
      code: 'VISIT_FETCH_ERROR'
    });
  }
});

// Get a specific visit
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const visit = await PropertyVisit.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
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
    
    if (!visit) {
      return res.status(404).json({ 
        message: 'Visit not found',
        code: 'VISIT_NOT_FOUND'
      });
    }
    
    return res.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    return res.status(500).json({ 
      message: 'Error fetching visit',
      code: 'VISIT_FETCH_ERROR'
    });
  }
});

// Schedule a property visit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { propertyId, visitType, scheduledDate, notes } = req.body;
    
    // Check if property exists
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ 
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }
    
    // Create new visit
    const visit = await PropertyVisit.create({
      userId: req.user.userId,
      propertyId,
      visitType,
      scheduledDate,
      notes,
      status: 'scheduled'
    });
    
    return res.status(201).json(visit);
  } catch (error) {
    console.error('Error scheduling visit:', error);
    return res.status(500).json({ 
      message: 'Error scheduling visit',
      code: 'VISIT_SCHEDULE_ERROR'
    });
  }
});

// Update a visit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { scheduledDate, notes, status } = req.body;
    
    // Find the visit
    const visit = await PropertyVisit.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!visit) {
      return res.status(404).json({ 
        message: 'Visit not found',
        code: 'VISIT_NOT_FOUND'
      });
    }
    
    // Prevent updating completed visits
    if (visit.status === 'completed' && status !== 'completed') {
      return res.status(400).json({ 
        message: 'Cannot update a completed visit',
        code: 'VISIT_ALREADY_COMPLETED'
      });
    }
    
    // Update the visit
    const updatedVisit = await visit.update({
      scheduledDate: scheduledDate || visit.scheduledDate,
      notes: notes || visit.notes,
      status: status || visit.status
    });
    
    return res.json(updatedVisit);
  } catch (error) {
    console.error('Error updating visit:', error);
    return res.status(500).json({ 
      message: 'Error updating visit',
      code: 'VISIT_UPDATE_ERROR'
    });
  }
});

// Add feedback to a visit
router.put('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { feedback } = req.body;
    
    // Find the visit
    const visit = await PropertyVisit.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!visit) {
      return res.status(404).json({ 
        message: 'Visit not found',
        code: 'VISIT_NOT_FOUND'
      });
    }
    
    // Update the visit with feedback
    const updatedVisit = await visit.update({
      feedback,
      status: 'completed'
    });
    
    return res.json(updatedVisit);
  } catch (error) {
    console.error('Error adding feedback:', error);
    return res.status(500).json({ 
      message: 'Error adding feedback',
      code: 'VISIT_FEEDBACK_ERROR'
    });
  }
});

// Cancel a visit
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    // Find the visit
    const visit = await PropertyVisit.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!visit) {
      return res.status(404).json({ 
        message: 'Visit not found',
        code: 'VISIT_NOT_FOUND'
      });
    }
    
    // Cannot cancel completed visits
    if (visit.status === 'completed') {
      return res.status(400).json({ 
        message: 'Cannot cancel a completed visit',
        code: 'VISIT_ALREADY_COMPLETED'
      });
    }
    
    // Update the visit status to cancelled
    const updatedVisit = await visit.update({
      status: 'cancelled'
    });
    
    return res.json(updatedVisit);
  } catch (error) {
    console.error('Error cancelling visit:', error);
    return res.status(500).json({ 
      message: 'Error cancelling visit',
      code: 'VISIT_CANCEL_ERROR'
    });
  }
});

// Property owner: Get all visits for properties owned by the current user
router.get('/owner/properties', authenticateToken, async (req, res) => {
  try {
    // Only property owners, agents, admin can access this
    if (!['property_listing', 'agent', 'admin', 'super_admin'].includes(req.user.userType)) {
      return res.status(403).json({ 
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    const visits = await PropertyVisit.findAll({
      include: [
        {
          model: Property,
          as: 'property',
          where: { ownerId: req.user.userId },
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    return res.json(visits);
  } catch (error) {
    console.error('Error fetching owner visits:', error);
    return res.status(500).json({ 
      message: 'Error fetching owner visits',
      code: 'VISIT_FETCH_ERROR'
    });
  }
});

// Property owner: Update visit status
router.put('/owner/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Only property owners, agents, admin can access this
    if (!['property_listing', 'agent', 'admin', 'super_admin'].includes(req.user.userType)) {
      return res.status(403).json({ 
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    // Find the visit
    const visit = await PropertyVisit.findByPk(req.params.id, {
      include: [{
        model: Property,
        as: 'property'
      }]
    });
    
    if (!visit) {
      return res.status(404).json({ 
        message: 'Visit not found',
        code: 'VISIT_NOT_FOUND'
      });
    }
    
    // Check if user is the owner of the property
    if (visit.property.ownerId !== req.user.userId && !['admin', 'super_admin'].includes(req.user.userType)) {
      return res.status(403).json({ 
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    // Update the visit status
    const updatedVisit = await visit.update({
      status
    });
    
    return res.json(updatedVisit);
  } catch (error) {
    console.error('Error updating visit status:', error);
    return res.status(500).json({ 
      message: 'Error updating visit status',
      code: 'VISIT_STATUS_UPDATE_ERROR'
    });
  }
});

// Admin route: Get all visits
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const visits = await PropertyVisit.findAll({
      include: [
        {
          model: Property,
          as: 'property'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    return res.json(visits);
  } catch (error) {
    console.error('Error fetching all visits:', error);
    return res.status(500).json({ 
      message: 'Error fetching all visits',
      code: 'VISIT_FETCH_ALL_ERROR'
    });
  }
});

module.exports = router; 