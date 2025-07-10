'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Albums_Images', 'captureDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'locationName', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'eventGroup', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'sortOrder', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'textAnnotation', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'rotation', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'zoom', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'zoomPositionX', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'zoomPositionY', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'caption', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'event_tags', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'height', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Albums_Images', 'width', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex('Albums_Images', ['captureDate']);
    await queryInterface.addIndex('Albums_Images', ['locationName']);
    await queryInterface.addIndex('Albums_Images', ['eventGroup']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Albums_Images', ['eventGroup']);
    await queryInterface.removeIndex('Albums_Images', ['locationName']);
    await queryInterface.removeIndex('Albums_Images', ['captureDate']);

    await queryInterface.removeColumn('Albums_Images', 'sortOrder');
    await queryInterface.removeColumn('Albums_Images', 'eventGroup');
    await queryInterface.removeColumn('Albums_Images', 'locationName');
    await queryInterface.removeColumn('Albums_Images', 'captureDate');
    await queryInterface.removeColumn('Albums_Images', 'textAnnotation');
    await queryInterface.removeColumn('Albums_Images', 'zoom');
    await queryInterface.removeColumn('Albums_Images', 'zoomPositionX');
    await queryInterface.removeColumn('Albums_Images', 'zoomPositionY');
    await queryInterface.removeColumn('Albums_Images', 'event_tags');
    await queryInterface.removeColumn('Albums_Images', 'caption');
    await queryInterface.removeColumn('Albums_Images', 'rotation');
    await queryInterface.removeColumn('Albums_Images', 'height');
    await queryInterface.removeColumn('Albums_Images', 'width');
  },
};
