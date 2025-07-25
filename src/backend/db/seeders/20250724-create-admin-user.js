"use strict";

const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if admin user already exists
    const existingAdmin = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE email = :email",
      {
        replacements: { email: "admin@albummai.com" },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    // Only create admin user if it doesn't exist
    if (existingAdmin.length === 0) {
      // Hash the password
      const hashedPassword = await bcrypt.hash("adminAlbum#123", 10);

      await queryInterface.bulkInsert("Users", [
        {
          name: "Admin User",
          email: "admin@albummai.com",
          password: hashedPassword,
          role: "admin",
          googleId: null,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists, skipping creation.");
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Users",
      {
        email: "admin@albummai.com",
      },
      {}
    );
  },
};
