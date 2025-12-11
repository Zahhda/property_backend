'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PropertyWishlist extends Model {
    static associate(models) {
      PropertyWishlist.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });
      PropertyWishlist.belongsTo(models.Property, {
        foreignKey: 'propertyId',
        as: 'property',
        onDelete: 'CASCADE'
      });
    }

    static async getUserWishlist(userId) {
      return await this.findAll({
        where: { userId },
        include: [
          {
            model: sequelize.models.Property,
            as: 'property',
            include: [{ model: sequelize.models.User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }]
          }
        ]
      });
    }

    static async isWishlisted(userId, propertyId) {
      return await this.findOne({ where: { userId, propertyId } });
    }

    static async addToWishlist(userId, propertyId, notes) {
      return await this.create({ userId, propertyId, notes });
    }

    static async updateWishlistNote(wishlistId, userId, notes) {
      const entry = await this.findOne({ where: { id: wishlistId, userId } });
      if (!entry) return null;
      return await entry.update({ notes });
    }

    static async removeFromWishlist(wishlistId, userId) {
      const entry = await this.findOne({ where: { id: wishlistId, userId } });
      if (!entry) return null;
      return await entry.destroy();
    }

    static async getAllWishlists() {
      return await this.findAll({
        include: [
          { model: sequelize.models.User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: sequelize.models.Property, as: 'property' }
        ]
      });
    }
  }

  PropertyWishlist.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PropertyWishlist',
    tableName: 'PropertyWishlists',
    timestamps: true
  });

  return PropertyWishlist;
};
