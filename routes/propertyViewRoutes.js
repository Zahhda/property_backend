// routes/propertyViewRoutes.js
const express = require('express');
const router = express.Router();
const propertyViewController = require('../controllers/propertyViewController');
const requestIp = require('request-ip');

// Middleware to capture client IP
router.use(requestIp.mw());

// POST /api/properties/:id/view
router.post('/properties/:id/view', propertyViewController.recordPropertyView);

module.exports = router;
