'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Roles', 'colorClass', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'CSS color class used for UI display'
    });

    // Add default colors to existing roles
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM Roles',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const colors = [
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    ];

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const colorClass = colors[i % colors.length];
      
      await queryInterface.sequelize.query(
        `UPDATE Roles SET colorClass = ? WHERE id = ?`,
        { 
          replacements: [colorClass, role.id],
          type: queryInterface.sequelize.QueryTypes.UPDATE 
        }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Roles', 'colorClass');
  }
}; 