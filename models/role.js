'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.belongsToMany(models.Permission, {
        through: models.RolePermission,
        foreignKey: 'roleId',
        as: 'permissions'
      });
      
      Role.belongsToMany(models.User, {
        through: models.UserRole,
        foreignKey: 'roleId',
        as: 'users'
      });

      Role.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });

      Role.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater'
      });

      Role.hasMany(models.RolePermission, {
        foreignKey: 'roleId',
        as: 'rolePermissions'
      });

      Role.hasMany(models.UserRole, {
        foreignKey: 'roleId',
        as: 'userRoles'
      });
    }
  }
  
  Role.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    colorClass: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'CSS color class used for UI display'
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'System roles cannot be deleted or modified by users'
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
    modelName: 'Role',
    hooks: {
      afterCreate: async (role, options) => {
        await sequelize.models.AuditLog.create({
          entityType: 'Role',
          entityId: role.id,
          action: 'CREATE',
          newValue: role.toJSON(),
          createdBy: options.userId || role.createdBy
        });
      },
      afterUpdate: async (role, options) => {
        const changedFields = role.changed();
        if (changedFields) {
          const previousValue = {};
          const newValue = {};
          changedFields.forEach(field => {
            previousValue[field] = role.previous(field);
            newValue[field] = role.get(field);
          });

          await sequelize.models.AuditLog.create({
            entityType: 'Role',
            entityId: role.id,
            action: 'UPDATE',
            previousValue,
            newValue,
            changedFields,
            createdBy: options.userId || role.updatedBy
          });
        }
      }
    }
  });
  
  return Role;
}; 