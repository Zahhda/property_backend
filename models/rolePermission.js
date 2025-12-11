'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate(models) {
      RolePermission.belongsTo(models.Role, {
        foreignKey: 'roleId'
      });
      
      RolePermission.belongsTo(models.Permission, {
        foreignKey: 'permissionId'
      });

      RolePermission.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }
  }
  
  RolePermission.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id'
      }
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Permissions',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'RolePermission',
    timestamps: true,
    updatedAt: false, // We don't need updatedAt for this join table
    indexes: [
      {
        unique: true,
        fields: ['roleId', 'permissionId']
      }
    ],
    hooks: {
      afterCreate: async (rolePermission, options) => {
        await sequelize.models.AuditLog.create({
          entityType: 'RolePermission',
          entityId: rolePermission.id,
          action: 'CREATE',
          newValue: rolePermission.toJSON(),
          createdBy: options.userId || rolePermission.createdBy
        });
      }
    }
  });
  
  return RolePermission;
}; 