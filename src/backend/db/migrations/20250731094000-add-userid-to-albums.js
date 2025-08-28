"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.addColumn("Albums", "userId", {
         type: Sequelize.INTEGER,
         allowNull: true, // Allow null initially for existing records
         references: {
            model: "Users",
            key: "id",
         },
         onUpdate: "CASCADE",
         onDelete: "SET NULL",
      });
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.removeColumn("Albums", "userId");
   },
};
