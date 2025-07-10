import {
  Model,
  DataTypes,
  InferCreationAttributes,
  InferAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from './db';

export type AlbumCreationAttributes = InferCreationAttributes<
  Album,
  {
    omit: 'id' | 'createdAt' | 'updatedAt';
  }
>;

class Album extends Model<InferAttributes<Album>, AlbumCreationAttributes> {
  declare readonly id: CreationOptional<string>;

  declare name: string;
  declare termsAccepted: boolean;
  declare status: 'draft' | 'in_progress' | 'complete';

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Album.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    termsAccepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'pending'),
      defaultValue: 'draft',
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
    modelName: 'Album',
  }
);

export default Album;
