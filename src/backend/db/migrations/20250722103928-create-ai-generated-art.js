"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("AI_Generated_Arts", {
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
         prompt: {
            type: Sequelize.TEXT,
            allowNull: false,
         },
         style: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         imageUrl: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         s3Key: {
            type: Sequelize.STRING,
            allowNull: true,
         },
         s3Url: {
            type: Sequelize.STRING,
            allowNull: true,
         },
         mimeType: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: "image/png",
         },
         width: {
            type: Sequelize.INTEGER,
            allowNull: true,
         },
         height: {
            type: Sequelize.INTEGER,
            allowNull: true,
         },
         generationModel: {
            type: Sequelize.STRING,
            allowNull: true,
         },
         generationParameters: {
            type: Sequelize.JSON,
            allowNull: true,
         },
         isPublic: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
         },
         isFavorite: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
         },
         albumId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
               model: "Albums",
               key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
         },
         tags: {
            type: Sequelize.JSON,
            allowNull: true,
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

      // Add indexes for better performance
      await queryInterface.addIndex("AI_Generated_Arts", ["userId"], {
         name: "idx_ai_art_user_id",
      });

      await queryInterface.addIndex("AI_Generated_Arts", ["albumId"], {
         name: "idx_ai_art_album_id",
      });

      await queryInterface.addIndex(
         "AI_Generated_Arts",
         ["userId", "isFavorite"],
         {
            name: "idx_ai_art_user_favorite",
         }
      );

      await queryInterface.addIndex("AI_Generated_Arts", ["isPublic"], {
         name: "idx_ai_art_public",
      });

      await queryInterface.addIndex("AI_Generated_Arts", ["createdAt"], {
         name: "idx_ai_art_created_at",
      });

      await queryInterface.addIndex("AI_Generated_Arts", ["style"], {
         name: "idx_ai_art_style",
      });
   },

   async down(queryInterface, Sequelize) {
      // Remove indexes first
      await queryInterface.removeIndex(
         "AI_Generated_Arts",
         "idx_ai_art_user_id"
      );
      await queryInterface.removeIndex(
         "AI_Generated_Arts",
         "idx_ai_art_album_id"
      );
      await queryInterface.removeIndex(
         "AI_Generated_Arts",
         "idx_ai_art_user_favorite"
      );
      await queryInterface.removeIndex(
         "AI_Generated_Arts",
         "idx_ai_art_public"
      );
      await queryInterface.removeIndex(
         "AI_Generated_Arts",
         "idx_ai_art_created_at"
      );
      await queryInterface.removeIndex("AI_Generated_Arts", "idx_ai_art_style");

      // Drop the table
      await queryInterface.dropTable("AI_Generated_Arts");
   },
};
