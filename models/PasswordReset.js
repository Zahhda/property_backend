'use strict';

module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
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
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'password_resets',
    timestamps: true,
    indexes: [
      {
        fields: ['token']
      },
      {
        fields: ['userId']
      }
    ]
  });

  return PasswordReset;
}; 