'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserRole extends Model {
    static associate(models) {
      UserRole.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      
      UserRole.belongsTo(models.Role, {
        foreignKey: 'roleId'
      });

      UserRole.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }
  }
  
  UserRole.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserRole',
    timestamps: true,
    updatedAt: false, // We don't need updatedAt for this join table
    indexes: [
      {
        unique: true,
        fields: ['userId', 'roleId']
      }
    ],
    hooks: {
      afterCreate: async (userRole, options) => {
        await sequelize.models.AuditLog.create({
          entityType: 'UserRole',
          entityId: userRole.id,
          action: 'CREATE',
          newValue: userRole.toJSON(),
          createdBy: options.userId || userRole.createdBy
        });
      }
    }
  });
  
  return UserRole;
}; 