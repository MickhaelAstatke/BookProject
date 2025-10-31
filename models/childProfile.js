"use strict";

module.exports = function (sequelize, DataTypes) {
  const ChildProfile = sequelize.define(
    "ChildProfile",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      birthdate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      readingLevel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      interests: {
        type: DataTypes.TEXT,
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

  ChildProfile.associate = function (models) {
    ChildProfile.belongsTo(models.User, { as: "guardian", foreignKey: "UserId" });
    ChildProfile.hasMany(models.ReadingProgress, { as: "readingProgress", foreignKey: "ChildProfileId" });
    ChildProfile.hasMany(models.Cart, { as: "cartEntries", foreignKey: "ChildProfileId" });
  };

  return ChildProfile;
};
