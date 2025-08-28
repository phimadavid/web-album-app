"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("Albums", {
         id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
         },
         name: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         termsAccepted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
         },
         status: {
            type: Sequelize.ENUM("draft", "in_progress", "completed"),
            defaultValue: "draft",
         },
         createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
         },
         updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
         },
      });
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.dropTable("Albums");
   },
};
