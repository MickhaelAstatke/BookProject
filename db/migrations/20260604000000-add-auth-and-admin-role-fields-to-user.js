"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("User", "adminRole", {
      type: Sequelize.ENUM("super_admin", "content_admin", "security_admin", "support_admin"),
      allowNull: true,
    });

    await queryInterface.addColumn("User", "emailVerified", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("User", "authProvider", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("User", "lastLoginAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("User", "lastLoginAt");
    await queryInterface.removeColumn("User", "authProvider");
    await queryInterface.removeColumn("User", "emailVerified");
    await queryInterface.removeColumn("User", "adminRole");

  },
};
