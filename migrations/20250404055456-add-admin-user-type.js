'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE Users MODIFY userType ENUM('property_searching', 'property_listing', 'admin') NOT NULL;`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE Users MODIFY userType ENUM('property_searching', 'property_listing') NOT NULL;`
    );
  }
};