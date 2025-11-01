"use strict";

module.exports = function (sequelize, DataTypes) {
  const Book = sequelize.define(
    "Book",
    {
      id: {
        // Sequelize module has INTEGER Data_Type.
        type: DataTypes.INTEGER,
        // To increment user_id automatically.
        autoIncrement: true,
        // user_id can not be null.
        allowNull: false,
        // For uniquely identify user.
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      genre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pubYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      readingLevel: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "general",
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      collectionTag: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isPremium: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      bookDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
    }
  );
  Book.associate = function (models) {
    Book.belongsTo(models.Author, {
      foreignKey: {
        allowNull: false,
      },
    });
    if (models.PlanBookAccess && models.Plan) {
      Book.belongsToMany(models.Plan, {
        through: models.PlanBookAccess,
        as: "plans",
      });
    }
  };

  return Book;
};
