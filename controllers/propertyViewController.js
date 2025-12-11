// controllers/propertyViewController.js
const { PropertyView, Property } = require('../models');

exports.recordPropertyView = async (req, res) => {
  try {
    const propertyId = req.params.id; // UUID of property
    const ipAddress = req.clientIp || req.ip; // Requires request-ip middleware

    // Check if property exists
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Use model's static method
    const { created } = await PropertyView.recordView(propertyId, ipAddress);

    res.json({
      success: true,
      message: created
        ? 'View recorded successfully'
        : 'View already counted for this IP',
      total_views: property.view_count + (created ? 1 : 0)
    });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
