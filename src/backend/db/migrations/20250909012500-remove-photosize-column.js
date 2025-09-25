"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      // Remove the photosize column from albums_formats table
      await queryInterface.removeColumn("albums_formats", "photosize");
   },

   async down(queryInterface, Sequelize) {
      // Add the photosize column back if we need to rollback
      await queryInterface.addColumn("albums_formats", "photosize", {
         type: Sequelize.STRING,
         allowNull: true,
         defaultValue: "medium", // Default value for rollback
      });
   },
};
