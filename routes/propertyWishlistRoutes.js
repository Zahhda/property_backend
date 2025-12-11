const express = require('express');
const router = express.Router();
const controller = require('../controllers/propertyWishlistController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, controller.getUserWishlist);
router.get('/check/:propertyId', authenticateToken, controller.checkWishlist);
router.post('/', authenticateToken, controller.addWishlist);
router.put('/:id', authenticateToken, controller.updateWishlist);
router.delete('/:id', authenticateToken, controller.removeWishlist);

// Admin route
router.get('/admin/all', authenticateToken, isAdmin, controller.getAllWishlists);

module.exports = router;
