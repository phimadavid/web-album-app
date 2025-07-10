//src/backend/db/model/db.ts
import dotenv from 'dotenv';
import { Options, Dialect, Sequelize } from 'sequelize';

import appConfig from '../config/app';
import dbConfig from '../config/db';

dotenv.config();

type SequelizeOptions = Options & {
  username: string;
  password: string;
  database: string;
  host: string;
  dialect: Dialect;
};

const config = dbConfig[appConfig.NODE_ENV] as SequelizeOptions;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

export { sequelize, Sequelize };
