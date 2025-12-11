'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Properties', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ownerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      propertyType: {
        type: Sequelize.ENUM('flat', 'house', 'villa', 'pg', 'flatmate'),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false
      },
      pincode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      totalArea: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      furnishedStatus: {
        type: Sequelize.ENUM('furnished', 'semi-furnished', 'unfurnished'),
        allowNull: false
      },
      amenities: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      description: {
        type: Sequelize.TEXT
      },
      images: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      availabilityStatus: {
        type: Sequelize.ENUM('available', 'rented', 'sold', 'pending'),
        defaultValue: 'available'
      },
      
      // Fields for Flats
      flatType: {
        type: Sequelize.ENUM('1BHK', '2BHK', '3BHK', '4BHK', '5+BHK'),
        allowNull: true
      },
      floorNumber: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      totalFloors: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      buildingAge: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      
      // Fields for Houses/Villas
      numRooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      numKitchens: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      numBathrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      carpetArea: {
        type: Sequelize.FLOAT,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      numBalconies: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      plotArea: {
        type: Sequelize.FLOAT,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      numFloors: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      
      // Fields for PG
      pgRoomType: {
        type: Sequelize.ENUM('shared', 'single bed', '2 bed', '3 bed', '4 bed'),
        allowNull: true
      },
      mealsIncluded: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      pgRules: {
        type: Sequelize.JSON,
        allowNull: true
      },
      
      // Fields for Flatmates
      numExistingFlatmates: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      genderPreference: {
        type: Sequelize.ENUM('male', 'female', 'any'),
        allowNull: true
      },
      occupationPreference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Properties');
  }
}; 