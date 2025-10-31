"use strict";

module.exports = function (sequelize, DataTypes) {
  const Checkout = sequelize.define(
    "Checkout",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      addressLine1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      addressLine2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      zipCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subTotal: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
    }
  );
  Checkout.associate = function (models) {
    Checkout.belongsTo(models.Cart, { foreignKey: "CartId" });
    Checkout.belongsTo(models.User, { foreignKey: "UserId", as: "user" });
  };

  return Checkout;
};
