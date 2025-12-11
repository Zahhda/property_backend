const db = require('../models');

exports.getDashboardSummary = async (req, res) => {
  try {
    const result = {};

    result.users = await db.User.count();
    result.properties = await db.Property.count();
    result.roles = await db.Role.count();
    res.status(200).json(result);
  } catch (err) {
    console.error('Dashboard Summary Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
