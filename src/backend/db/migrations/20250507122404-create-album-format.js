"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("albums_formats", {
         id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
         },
         albumId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
               model: "Albums",
               key: "id",
            },
         },
         format: {
            type: Sequelize.STRING(15),
            allowNull: false,
         },
         dimensions: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         photosize: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         coverType: {
            type: Sequelize.STRING(15),
            allowNull: false,
         },
         paperQuality: {
            type: Sequelize.STRING(15),
            allowNull: false,
         },
         pages: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 24,
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

      // Add indexes
      await queryInterface.addIndex("albums_formats", ["format"]);
      await queryInterface.addIndex("albums_formats", ["coverType"]);
      await queryInterface.addIndex("albums_formats", ["paperQuality"]);
   },

   async down(queryInterfac) {
      await queryInterface.dropTable("albums_formats");
   },
};
