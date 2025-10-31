"use strict";

module.exports = function (sequelize, DataTypes) {
  const Benefit = sequelize.define(
    "Benefit",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
    }
  );

  Benefit.associate = function (models) {
    if (models.PlanBenefit && models.Plan) {
      Benefit.belongsToMany(models.Plan, {
        through: models.PlanBenefit,
        as: "plans",
      });
    }
  };

  return Benefit;
};
