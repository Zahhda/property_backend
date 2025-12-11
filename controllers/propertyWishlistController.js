const { PropertyWishlist, Property } = require('../models');

exports.getUserWishlist = async (req, res) => {
  try {
    const wishlists = await PropertyWishlist.getUserWishlist(req.user.userId);
    res.json(wishlists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
};

exports.checkWishlist = async (req, res) => {
  try {
    const wishlist = await PropertyWishlist.isWishlisted(req.user.userId, req.params.propertyId);
    res.json({ isWishlisted: !!wishlist, wishlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error checking wishlist' });
  }
};

exports.addWishlist = async (req, res) => {
  try {
    const { propertyId, notes } = req.body;

    const property = await Property.findByPk(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const existing = await PropertyWishlist.isWishlisted(req.user.userId, propertyId);
    if (existing) return res.status(400).json({ message: 'Already in wishlist' });

    const wishlist = await PropertyWishlist.addToWishlist(req.user.userId, propertyId, notes);
    res.status(201).json(wishlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding to wishlist' });
  }
};

exports.updateWishlist = async (req, res) => {
  try {
    const { notes } = req.body;
    const updated = await PropertyWishlist.updateWishlistNote(req.params.id, req.user.userId, notes);
    if (!updated) return res.status(404).json({ message: 'Wishlist not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating wishlist' });
  }
};

exports.removeWishlist = async (req, res) => {
  try {
    const removed = await PropertyWishlist.removeFromWishlist(req.params.id, req.user.userId);
    if (!removed) return res.status(404).json({ message: 'Wishlist not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error removing wishlist' });
  }
};

exports.getAllWishlists = async (req, res) => {
  try {
    const all = await PropertyWishlist.getAllWishlists();
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching all wishlists' });
  }
};
