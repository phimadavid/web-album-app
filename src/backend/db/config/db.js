//src/backend/db/config/db.js
const dotenv = require("dotenv");
dotenv.config();

const app = new Proxy(process.env, {
   get: (target, prop) => {
      if (!(prop in target)) {
         throw new Error(`Environment variable ${prop} is missing`);
      }

      return target[prop];
   },
});

const config = {
   production: {
      username: app.DB_USER,
      password: app.DB_PASS,
      database: app.DB_NAME,
      host: app.DB_HOST,
      dialect: "mysql",
      dialectModule: require("mysql2"),
      logging: false,
      dialectOptions: {
         decimalNumbers: true,
      },
   },
   get development() {
      return {
         ...this.production,
         logging: console.log,
      };
   },
   get test() {
      return {
         ...this.development,
         database: `${app.DB_NAME}-test`,
         logging: false,
      };
   },
};

module.exports = config; // required for sequelize-cli
