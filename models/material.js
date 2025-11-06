"use strict";

module.exports = function (sequelize, DataTypes) {
  const Material = sequelize.define(
    "Material",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("book", "audiobook", "video"),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      thumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      assetUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isPremium: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      freezeTableName: true,
    }
  );

  Material.associate = function (models) {
    Material.belongsTo(models.Author, {
      foreignKey: { name: "AuthorId", allowNull: false },
      onDelete: "CASCADE",
    });
    Material.belongsTo(models.User, {
      as: "uploader",
      foreignKey: { name: "UserId", allowNull: false },
      onDelete: "CASCADE",
    });
  };

  return Material;
};
