'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('layouts', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      albumId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Albums',
          key: 'id',
        },
      },
      layout: {
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
    await queryInterface.dropTable('layouts');
  },
};
