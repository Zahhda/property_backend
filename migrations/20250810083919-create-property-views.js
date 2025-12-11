'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('property_views', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // ✅ generates UUID automatically
        allowNull: false,
        primaryKey: true
      },
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('property_views', {
      fields: ['property_id', 'ip_address'],
      type: 'unique',
      name: 'unique_property_ip'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('property_views');
  }
};
