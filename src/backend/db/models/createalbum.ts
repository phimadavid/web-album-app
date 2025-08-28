import {
   CreationOptional,
   DataTypes,
   InferAttributes,
   InferCreationAttributes,
   Model,
} from "sequelize";
import { sequelize } from "./db";

export type CreateAlbumCreationAttributes = InferCreationAttributes<
   CreateAlbum,
   {
      omit: "id" | "createdAt" | "updatedAt";
   }
>;
class CreateAlbum extends Model<
   InferAttributes<CreateAlbum>,
   CreateAlbumCreationAttributes
> {
   declare readonly id: CreationOptional<string>;

   declare albumId: string;
   declare format: string;
   declare dimensions: string;
   declare photosize: string;
   declare coverType: string;
   declare paperQuality: string;

   // Timestamps
   declare readonly createdAt: CreationOptional<Date>;
   declare readonly updatedAt: CreationOptional<Date>;
}

CreateAlbum.init(
   {
      id: {
         allowNull: false,
         autoIncrement: true,
         primaryKey: true,
         type: DataTypes.INTEGER.UNSIGNED,
      },
      albumId: {
         type: DataTypes.UUID,
         allowNull: false,
         references: {
            model: "Albums",
            key: "id",
         },
      },
      format: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      dimensions: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      photosize: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      coverType: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      paperQuality: {
         type: DataTypes.STRING,
         allowNull: false,
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
      tableName: "albums_formats",
   }
);

export default CreateAlbum;
