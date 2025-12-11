'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const roles = [
      {
        id: uuidv4(),
        name: 'Admin',
        description: 'Administrator with full access to all features',
        isSystem: true,
        status: 'active',
        colorClass: 'bg-red-100 text-red-800',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Manager',
        description: 'Property manager with access to property management features',
        isSystem: true,
        status: 'active',
        colorClass: 'bg-green-100 text-green-800',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Agent',
        description: 'Real estate agent with access to listing features',
        isSystem: true,
        status: 'active',
        colorClass: 'bg-blue-100 text-blue-800',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Client',
        description: 'Client with access to limited features',
        isSystem: true,
        status: 'active',
        colorClass: 'bg-yellow-100 text-yellow-800',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return queryInterface.bulkInsert('Roles', roles);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Roles', null, {});
  }
}; 