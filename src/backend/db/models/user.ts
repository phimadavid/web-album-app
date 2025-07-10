import {
  Model,
  DataTypes,
  InferCreationAttributes,
  InferAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from './db';

const roles = ['user', 'admin'] as const;

export enum Role {
  user = 'user',
  admin = 'admin',
}

export type UserCreationAttributes = InferCreationAttributes<
  User,
  {
    omit: 'id' | 'createdAt' | 'updatedAt';
  }
>;

class User extends Model<InferAttributes<User>, UserCreationAttributes> {
  declare readonly id: CreationOptional<number>;

  declare name: string;
  declare email: string;
  declare password: string;
  declare role: Role;
  declare googleId: string | null;
  declare image: string | null;

  // declare isEmailVerified: boolean;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

User.init(
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
    password: {
      allowNull: false,
      type: DataTypes.STRING,
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
    role: {
      allowNull: false,
      type: DataTypes.ENUM(...roles),
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
    modelName: 'Users',
  }
);

export default User;
