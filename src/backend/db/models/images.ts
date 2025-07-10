import {
  Model,
  DataTypes,
  InferCreationAttributes,
  InferAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from './db';
import Album from './album';

export type ImageCreationAttributes = InferCreationAttributes<
  Image,
  {
    omit: 'id' | 'createdAt' | 'updatedAt';
  }
>;

class Image extends Model<InferAttributes<Image>, ImageCreationAttributes> {
  declare readonly id: CreationOptional<string>;
  declare albumId: string;
  declare filename: string;
  declare s3Url: string;
  declare s3Key: string;
  declare mimeType: string;
  declare previewUrl: string | null;
  declare captureDate: CreationOptional<Date | null>;

  declare textAnnotation: CreationOptional<JSON | null>;
  declare rotation: CreationOptional<number | null>;
  declare zoom: CreationOptional<number | null>;
  declare zoomPositionX: CreationOptional<number | null>;
  declare zoomPositionY: CreationOptional<number | null>;
  declare locationName: CreationOptional<string | null>;
  declare eventGroup: CreationOptional<string | null>;
  declare sortOrder: CreationOptional<number>;
  declare caption: CreationOptional<string | null>;
  declare event_tags: CreationOptional<JSON | null>;
  declare height: CreationOptional<number | null>;
  declare width: CreationOptional<number | null>;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Image.init(
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
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    s3Key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    s3Url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    previewUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    captureDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    locationName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eventGroup: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    textAnnotation: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rotation: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    caption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    event_tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    zoom: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    zoomPositionX: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    zoomPositionY: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    width: {
      type: DataTypes.INTEGER,
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
    modelName: 'Albums_Images',
    indexes: [
      {
        fields: ['captureDate'],
      },
      {
        fields: ['locationName'],
      },
      {
        fields: ['eventGroup'],
      },
      {
        fields: ['isCover'],
      },
    ],
  }
);

export default Image;
