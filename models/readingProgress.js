"use strict";

module.exports = function (sequelize, DataTypes) {
  const ReadingProgress = sequelize.define(
    "ReadingProgress",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      progressPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      lastReadAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ChildProfileId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      BookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
    }
  );

  ReadingProgress.associate = function (models) {
    ReadingProgress.belongsTo(models.User, { as: "user", foreignKey: "UserId" });
    ReadingProgress.belongsTo(models.ChildProfile, { as: "childProfile", foreignKey: "ChildProfileId" });
    ReadingProgress.belongsTo(models.Book, { as: "book", foreignKey: "BookId" });
  };

  return ReadingProgress;
};
