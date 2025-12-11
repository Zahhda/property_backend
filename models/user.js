'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
      User.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater'
      });
      User.hasMany(models.Property, {
        foreignKey: 'ownerId',
        as: 'properties'
      });
      User.hasMany(models.PropertyWishlist, {
        foreignKey: 'userId',
        as: 'wishlists'
      });
      User.hasMany(models.PropertyVisit, {
        foreignKey: 'userId',
        as: 'visits'
      });
      User.belongsToMany(models.Role, {
        through: models.UserRole,
        foreignKey: 'userId',
        as: 'roles'
      });
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^\d{10}$/
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User type derived from role, for backward compatibility'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'inactive',
      allowNull: false
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      afterCreate: async (user, options) => {
        await sequelize.models.AuditLog.create({
          entityType: 'User',
          entityId: user.id,
          action: 'CREATE',
          newValue: user.toJSON(),
          createdBy: options.userId || user.id
        });
      },
      afterUpdate: async (user, options) => {
        const changedFields = user.changed();
        if (changedFields) {
          const previousValue = {};
          const newValue = {};
          changedFields.forEach(field => {
            previousValue[field] = user.previous(field);
            newValue[field] = user.get(field);
          });

          await sequelize.models.AuditLog.create({
            entityType: 'User',
            entityId: user.id,
            action: 'UPDATE',
            previousValue,
            newValue,
            changedFields,
            createdBy: options.userId
          });
        }
      }
    }
  });
  
  return User;
}; 