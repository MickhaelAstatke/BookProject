"use strict";

module.exports = function (sequelize, DataTypes) {
  const Subscription = sequelize.define(
    "Subscription",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      planName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "free",
      },
      status: {
        type: DataTypes.ENUM("inactive", "trial", "active", "past_due", "canceled"),
        allowNull: false,
        defaultValue: "trial",
      },
      renewalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingReference: {
        type: DataTypes.STRING,
        allowNull: true,
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

  Subscription.associate = function (models) {
    Subscription.belongsTo(models.User, { as: "user", foreignKey: "UserId" });
  };

  return Subscription;
};
