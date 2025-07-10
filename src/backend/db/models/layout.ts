import {
  Model,
  DataTypes,
  InferCreationAttributes,
  InferAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from './db';
import Album from './album';

class Layout extends Model<
  InferAttributes<Layout>,
  InferCreationAttributes<Layout>
> {
  declare readonly id: CreationOptional<string>;

  declare albumId: string;
  declare layout: string;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Layout.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    albumId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Album,
        key: 'id',
      },
    },
    layout: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'layouts',
    timestamps: true,
  }
);

export default Layout;
