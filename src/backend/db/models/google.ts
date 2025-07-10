import {
  Model,
  DataTypes,
  InferCreationAttributes,
  InferAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from './db';

export type GoogleCreationAttributes = InferCreationAttributes<
  Google,
  {
    omit: 'id' | 'createdAt' | 'updatedAt';
  }
>;

class Google extends Model<InferAttributes<Google>, GoogleCreationAttributes> {
  declare readonly id: CreationOptional<number>;

  declare name: string;
  declare email: string;
  declare googleId: string;
  declare image: string;

  // declare isEmailVerified: boolean;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Google.init(
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    email: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'GoogleUsers',
  }
);

export default Google;
