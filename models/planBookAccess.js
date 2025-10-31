"use strict";

module.exports = function (sequelize, DataTypes) {
  const PlanBookAccess = sequelize.define(
    "PlanBookAccess",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      accessType: {
        type: DataTypes.ENUM("full", "excerpt", "featured"),
        allowNull: false,
        defaultValue: "full",
      },
    },
    {
      freezeTableName: true,
    }
  );

  return PlanBookAccess;
};
