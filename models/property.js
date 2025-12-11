'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Property extends Model {
    static associate(models) {
      Property.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
      Property.hasMany(models.PropertyWishlist, {
        foreignKey: 'propertyId',
        as: 'wishlists'
      });
      Property.hasMany(models.PropertyVisit, {
        foreignKey: 'propertyId',
        as: 'visits'
      });
    }
  }
  
  Property.init({
    // Common fields for all property types
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    propertyType: {
      type: DataTypes.ENUM('flat', 'house', 'villa', 'pg', 'flatmate'),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^\d{6}$/i
      }
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    totalArea: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Area in square feet',
      validate: {
        min: 0
      }
    },
    furnishedStatus: {
      type: DataTypes.ENUM('furnished', 'semi-furnished', 'unfurnished'),
      allowNull: true
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    availabilityStatus: {
      type: DataTypes.ENUM('available', 'rented', 'sold', 'pending'),
      defaultValue: 'available'
    },
    
    // Fields for Flats
    flatType: {
      type: DataTypes.ENUM('1BHK', '2BHK', '3BHK', '4BHK', '5+BHK'),
      allowNull: true
    },
    floorNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    totalFloors: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    buildingAge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Age of building in years',
      validate: {
        min: 0
      }
    },
    
    // Fields for Houses/Villas
    numRooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    numKitchens: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    numBathrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    carpetArea: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Carpet area in square feet',
      validate: {
        min: 0
      }
    },
    numBalconies: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    plotArea: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Plot area in square feet',
      validate: {
        min: 0
      }
    },
    numFloors: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    
    // Fields for PG
    pgRoomType: {
      type: DataTypes.ENUM('shared', 'single bed', '2 bed', '3 bed', '4 bed'),
      allowNull: true
    },
    mealsIncluded: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    pgRules: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    
    // Fields for Flatmates
    numExistingFlatmates: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    genderPreference: {
      type: DataTypes.ENUM('male', 'female', 'any'),
      allowNull: true
    },
    occupationPreference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Additional fields for improved property listing
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      }
    },
    nearbyFacilities: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    isPremiumListing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Property',
    indexes: [
      {
        fields: ['propertyType']
      },
      {
        fields: ['city']
      },
      {
        fields: ['availabilityStatus']
      },
      {
        fields: ['ownerId']
      }
    ]
  });
  
  return Property;
}; 