'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      // define associations here
    }
  }
  
  AuditLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityType: DataTypes.STRING,
    entityId: DataTypes.UUID,
    action: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
    previousValue: DataTypes.JSON,
    newValue: DataTypes.JSON,
    changedFields: DataTypes.JSON,
    createdBy: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'AuditLog',
  });
  
  return AuditLog;
}; 