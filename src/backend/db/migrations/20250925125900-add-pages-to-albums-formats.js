"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      // Check if the column already exists before adding it
      const tableDescription = await queryInterface.describeTable("albums_formats");
      
      if (!tableDescription.pages) {
         await queryInterface.addColumn("albums_formats", "pages", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 24,
         });
         
         console.log("✅ Added 'pages' column to albums_formats table");
      } else {
         console.log("ℹ️ 'pages' column already exists in albums_formats table");
      }
   },

   async down(queryInterface, Sequelize) {
      // Check if the column exists before removing it
      const tableDescription = await queryInterface.describeTable("albums_formats");
      
      if (tableDescription.pages) {
         await queryInterface.removeColumn("albums_formats", "pages");
         console.log("✅ Removed 'pages' column from albums_formats table");
      }
   },
};
