'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('books', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      bookId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      albumId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      previewUrl: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      theme: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      style: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      colors: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      cover_image_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      cover_images: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      templateImage: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      eventCategory: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      promptWord: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      detectedTags: {
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
    await queryInterface.addIndex('books', ['albumId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('books');
  },
};
