"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'pending' to the existing ENUM
    await queryInterface.changeColumn("Albums", "status", {
      type: Sequelize.ENUM("draft", "in_progress", "completed", "pending"),
      defaultValue: "draft",
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to original ENUM values
    await queryInterface.changeColumn("Albums", "status", {
      type: Sequelize.ENUM("draft", "in_progress", "completed"),
      defaultValue: "draft",
      allowNull: true,
    });
  },
};
