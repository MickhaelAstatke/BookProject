"use strict";

module.exports = function (sequelize, DataTypes) {
  const PlanBenefit = sequelize.define(
    "PlanBenefit",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      highlight: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
    }
  );

  return PlanBenefit;
};
