'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PropertyView extends Model {
    static associate(models) {
      // A property view belongs to a property
      PropertyView.belongsTo(models.Property, {
        foreignKey: 'property_id',
        as: 'property'
      });
    }

    /**
     * Record a property view for a given IP address.
     * Only creates a new view if that IP hasn't viewed it before.
     */
    static async recordView(propertyId, ipAddress) {
      const { Property } = sequelize.models;

      // Check if this IP already viewed the property
      const existingView = await PropertyView.findOne({
        where: {
          property_id: propertyId,
          ip_address: ipAddress
        }
      });

      if (existingView) {
        return { created: false, propertyView: existingView };
      }

      // Create a new view record
      const propertyView = await PropertyView.create({
        property_id: propertyId,
        ip_address: ipAddress
      });

      // Increment view_count on the property
      await Property.increment('view_count', {
        by: 1,
        where: { id: propertyId }
      });

      return { created: true, propertyView };
    }
  }

  PropertyView.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // ✅ match migration
        primaryKey: true,
        allowNull: false
      },
      property_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      ip_address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIP: true
        }
      }
    },
    {
      sequelize,
      modelName: 'PropertyView',
      tableName: 'property_views',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['property_id', 'ip_address'] // ✅ match migration constraint
        }
      ]
    }
  );

  return PropertyView;
};
