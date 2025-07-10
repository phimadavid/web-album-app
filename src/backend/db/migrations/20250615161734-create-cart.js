'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Carts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      albumId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      bookFormat: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      coverType: {
        type: Sequelize.ENUM('softcover', 'hardcover', 'dutch'),
        allowNull: false,
      },
      pageCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 24,
      },
      shippingOption: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      shippingPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      customizations: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
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
    await queryInterface.addIndex('Carts', ['userId'], {
      name: 'idx_carts_user_id',
    });

    await queryInterface.addIndex('Carts', ['albumId'], {
      name: 'idx_carts_album_id',
    });

    await queryInterface.addIndex('Carts', ['userId', 'albumId'], {
      name: 'idx_carts_user_album',
    });

    await queryInterface.addIndex('Carts', ['createdAt'], {
      name: 'idx_carts_created_at',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('Carts', 'idx_carts_user_id');
    await queryInterface.removeIndex('Carts', 'idx_carts_album_id');
    await queryInterface.removeIndex('Carts', 'idx_carts_user_album');
    await queryInterface.removeIndex('Carts', 'idx_carts_created_at');

    // Drop the table
    await queryInterface.dropTable('Carts');
  },
};
