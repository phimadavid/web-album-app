"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("Albums_Images", {
         id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
         },
         albumId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
               model: "Albums",
               key: "id",
            },
         },
         filename: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         s3Key: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         s3Url: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         mimeType: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         previewUrl: {
            type: Sequelize.STRING,
            allowNull: false,
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
      await queryInterface.dropTable("Albums_Images");
   },
};
