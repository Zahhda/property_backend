const { Sequelize } = require('sequelize');
const config = require('./config');

// Get MySQL configuration
const { database, username, password, host, dialect } = config.development;

// Create Sequelize instance for MySQL
const sequelize = new Sequelize(database, username, password, {
  host,
  dialect, // This should be 'mysql' from the config
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

module.exports = sequelize; 