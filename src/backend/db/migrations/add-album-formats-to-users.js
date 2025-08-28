"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.addColumn("Users", "album_formats", {
         type: Sequelize.JSON,
         allowNull: true,
         defaultValue: null,
      });
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.removeColumn("Users", "album_formats");
   },
};
