"use strict";

module.exports = function (sequelize, DataTypes) {
  const Subscription = sequelize.define(
    "Subscription",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      planName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "free",
      },
      status: {
        type: DataTypes.ENUM("inactive", "trial", "active", "past_due", "canceled"),
        allowNull: false,
        defaultValue: "trial",
      },
      renewalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingReference: {
        type: DataTypes.STRING,
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

  Subscription.associate = function (models) {
    Subscription.belongsTo(models.User, { as: "user", foreignKey: "UserId" });
  };

  return Subscription;
};

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
        foreignKey: {
          allowNull: false,
        },
        as: "plan",
      });
    }

    if (models.User) {
      Subscription.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  };

  return Subscription;
};
