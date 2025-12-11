const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const auth = require('../middleware/auth');
const { validate, propertySchema } = require('../middleware/validation');

// Apply validation to routes that modify data
router.post('/create', auth, validate(propertySchema), propertyController.createProperty);
router.put('/update/:id', auth, validate(propertySchema), propertyController.updateProperty);
router.get('/list', propertyController.listProperties);
router.get('/:id', propertyController.getPropertyById);
router.delete('/:id', auth, propertyController.deleteProperty);

module.exports = router; 