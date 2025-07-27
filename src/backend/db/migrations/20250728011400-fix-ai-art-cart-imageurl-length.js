'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Alter the imageUrl column in AiArtCarts table to handle longer URLs
    await queryInterface.changeColumn('AiArtCarts', 'imageUrl', {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    // Also ensure prompt column can handle long text
    await queryInterface.changeColumn('AiArtCarts', 'prompt', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to STRING (this might cause data loss if URLs are longer than 255 chars)
    await queryInterface.changeColumn('AiArtCarts', 'imageUrl', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('AiArtCarts', 'prompt', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
