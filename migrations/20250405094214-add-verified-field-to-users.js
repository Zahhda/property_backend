'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add the 'verified' column to the Users table
    await queryInterface.addColumn('Users', 'verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      after: 'status' // Position the column after 'status'
    });
    
    // Update existing users, setting all to verified since they're already in the system
    await queryInterface.sequelize.query(`
      UPDATE Users SET verified = true;
    `);
  },

  async down (queryInterface, Sequelize) {
    // Remove the 'verified' column if the migration is rolled back
    await queryInterface.removeColumn('Users', 'verified');
  }
};
