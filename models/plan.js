"use strict";

module.exports = function (sequelize, DataTypes) {
  const Plan = sequelize.define(
    "Plan",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priceCents: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      billingInterval: {
        type: DataTypes.ENUM("monthly", "yearly"),
        allowNull: false,
        defaultValue: "monthly",
      },
      trialDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      featuredContentHeadline: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
    }
  );

  Plan.associate = function (models) {
    if (models.PlanBenefit && models.Benefit) {
      Plan.belongsToMany(models.Benefit, {
        through: models.PlanBenefit,
        as: "benefits",
      });
    }

    if (models.PlanBookAccess && models.Book) {
      Plan.belongsToMany(models.Book, {
        through: models.PlanBookAccess,
        as: "availableBooks",
      });
    }

    if (models.Subscription) {
      Plan.hasMany(models.Subscription, {
        as: "subscriptions",
      });
    }
  };

  return Plan;
};
