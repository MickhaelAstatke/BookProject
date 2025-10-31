"use strict";

module.exports = function (sequelize, DataTypes) {
  const Cart = sequelize.define(
    "Cart",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ChildProfileId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
    }
  );
  Cart.associate = function (models) {
    Cart.belongsToMany(models.Book, { through: "Cartbook" });
    Cart.belongsTo(models.User, { as: "user", foreignKey: "UserId" });
    Cart.belongsTo(models.ChildProfile, { as: "childProfile", foreignKey: "ChildProfileId" });
    Cart.hasOne(models.Checkout, { foreignKey: "CartId" });
  };

  return Cart;
};