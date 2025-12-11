'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      Permission.belongsToMany(models.Role, {
        through: models.RolePermission,
        foreignKey: 'permissionId',
        as: 'roles'
      });

      Permission.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });

      Permission.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater'
      });
    }
  }
  
  Permission.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50]
      },
      comment: 'Module this permission belongs to (e.g., user_management, property_management, etc.)'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50]
      },
      comment: 'Action this permission allows (e.g., view, create, update, delete, etc.)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'System permissions cannot be deleted'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Permission',
    indexes: [
      {
        unique: true,
        fields: ['module', 'action']
      }
    ],
    hooks: {
      afterCreate: async (permission, options) => {
        await sequelize.models.AuditLog.create({
          entityType: 'Permission',
          entityId: permission.id,
          action: 'CREATE',
          newValue: permission.toJSON(),
          createdBy: options.userId || permission.createdBy
        });
      },
      afterUpdate: async (permission, options) => {
        const changedFields = permission.changed();
        if (changedFields) {
          const previousValue = {};
          const newValue = {};
          changedFields.forEach(field => {
            previousValue[field] = permission.previous(field);
            newValue[field] = permission.get(field);
          });

          await sequelize.models.AuditLog.create({
            entityType: 'Permission',
            entityId: permission.id,
            action: 'UPDATE',
            previousValue,
            newValue,
            changedFields,
            createdBy: options.userId || permission.updatedBy
          });
        }
      }
    }
  });
  
  return Permission;
}; 