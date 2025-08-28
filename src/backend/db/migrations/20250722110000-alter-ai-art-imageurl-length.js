"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      // Alter the imageUrl column to allow longer URLs
      await queryInterface.changeColumn("AI_Generated_Arts", "imageUrl", {
         type: Sequelize.TEXT,
         allowNull: false,
      });

      // Also update s3Url column to handle longer URLs if needed
      await queryInterface.changeColumn("AI_Generated_Arts", "s3Url", {
         type: Sequelize.TEXT,
         allowNull: true,
      });
   },

   async down(queryInterface, Sequelize) {
      // Revert back to STRING (this might cause data loss if URLs are longer than 255 chars)
      await queryInterface.changeColumn("AI_Generated_Arts", "imageUrl", {
         type: Sequelize.STRING,
         allowNull: false,
      });

      await queryInterface.changeColumn("AI_Generated_Arts", "s3Url", {
         type: Sequelize.STRING,
         allowNull: true,
      });
   },
};
