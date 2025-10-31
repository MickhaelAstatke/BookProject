"use strict";

module.exports = function (sequelize, DataTypes) {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      firebaseUid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guardianName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isGuardian: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      subscriptionStatus: {
        type: DataTypes.ENUM("inactive", "trial", "active", "past_due", "canceled"),
        allowNull: false,
        defaultValue: "trial",
      },
      subscriptionPlan: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "free",
      },
      subscriptionRenewalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      billingEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      billingPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
    }
  );

  User.associate = function (models) {
    User.hasMany(models.ChildProfile, { as: "children", foreignKey: "UserId" });
    User.hasMany(models.Cart, { as: "cartItems", foreignKey: "UserId" });
    User.hasMany(models.Subscription, { as: "subscriptions", foreignKey: "UserId" });
    User.hasMany(models.ReadingProgress, { as: "readingProgress", foreignKey: "UserId" });
  };

  User.prototype.toSafeJSON = function () {
    const values = { ...this.get() };
    delete values.firebaseUid;
    return values;
  };

  return User;
};
