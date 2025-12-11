'use strict';

module.exports = (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define('PaymentTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    gatewayTransactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paymentType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    selectedMonth: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payingTo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vpa: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ifsc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'success', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    successUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    failureUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    redirectUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gatewayResponse: {
      type: DataTypes.JSON,
      allowNull: true
    },
    webhookData: {
      type: DataTypes.JSON,
      allowNull: true
    },
    webhookReceived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'payment_transactions',
    underscored: true
  });

  PaymentTransaction.associate = (models) => {
    PaymentTransaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return PaymentTransaction;
};

