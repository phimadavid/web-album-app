"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("AiArtCarts", {
         id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
         },
         userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
               model: "Users",
               key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         },
         aiArtId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
               model: "AI_Generated_Arts",
               key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
         },
         imageUrl: {
            type: Sequelize.TEXT,
            allowNull: false,
         },
         prompt: {
            type: Sequelize.TEXT,
            allowNull: false,
         },
         style: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
         },
         productType: {
            type: Sequelize.ENUM("canvas", "glass", "aluminum"),
            allowNull: false,
         },
         size: {
            type: Sequelize.ENUM(
               "small",
               "medium",
               "large",
               "xlarge",
               "xxlarge"
            ),
            allowNull: false,
         },
         dimensions: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
         },
         totalPrice: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
         },
         createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
         },
         updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
         },
      });
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.dropTable("AiArtCarts");
   },
};
