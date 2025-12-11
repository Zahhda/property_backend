'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE Users MODIFY userType ENUM('property_searching', 'property_listing', 'admin', 'super_admin') NOT NULL;`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE Users MODIFY userType ENUM('property_searching', 'property_listing', 'admin') NOT NULL;`
    );
  }
};
