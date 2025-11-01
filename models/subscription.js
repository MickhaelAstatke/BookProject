"use strict";

module.exports = function (sequelize, DataTypes) {
  const Subscription = sequelize.define(
    "Subscription",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("trialing", "active", "canceled", "expired"),
        allowNull: false,
        defaultValue: "trialing",
      },
      trialEndsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      renewsOn: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      canceledOn: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      userReference: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "External identifier that maps to the eventual User model.",
      },
    },
    {
      freezeTableName: true,
    }
  );

  Subscription.associate = function (models) {
    if (models.Plan) {
      Subscription.belongsTo(models.Plan, {
        as: "plan",
        foreignKey: {
          name: "PlanId",
          allowNull: false,
        },
      });
    }

    if (models.User) {
      Subscription.belongsTo(models.User, {
        as: "user",
        foreignKey: {
          name: "UserId",
          allowNull: true,
        },
      });
    }
  };

  return Subscription;
};
