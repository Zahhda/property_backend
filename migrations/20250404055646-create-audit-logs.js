'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditLogs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())')
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      action: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE'),
        allowNull: false
      },
      previousValue: {
        type: Sequelize.JSON,
        allowNull: true
      },
      newValue: {
        type: Sequelize.JSON,
        allowNull: true
      },
      changedFields: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AuditLogs');
  }
};