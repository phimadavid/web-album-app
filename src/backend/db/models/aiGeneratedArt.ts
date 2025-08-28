import {
   Model,
   DataTypes,
   InferCreationAttributes,
   InferAttributes,
   CreationOptional,
} from "sequelize";
import { sequelize } from "./db";
import User from "./user";
import Album from "./album";

export type AiGeneratedArtCreationAttributes = InferCreationAttributes<
   AiGeneratedArt,
   {
      omit: "id" | "createdAt" | "updatedAt";
   }
>;

class AiGeneratedArt extends Model<
   InferAttributes<AiGeneratedArt>,
   AiGeneratedArtCreationAttributes
> {
   declare readonly id: CreationOptional<string>;
   declare userId: number;
   declare prompt: string;
   declare style: string;
   declare imageUrl: string;
   declare s3Key: string | null;
   declare s3Url: string | null;
   declare mimeType: string | null;
   declare width: number | null;
   declare height: number | null;
   declare generationModel: string | null;
   declare generationParameters: JSON | null;
   declare isPublic: boolean;
   declare isFavorite: boolean;
   declare albumId: string | null;
   declare tags: JSON | null;

   declare readonly createdAt: CreationOptional<Date>;
   declare readonly updatedAt: CreationOptional<Date>;
}

AiGeneratedArt.init(
   {
      id: {
         type: DataTypes.UUID,
         defaultValue: DataTypes.UUIDV4,
         primaryKey: true,
         allowNull: false,
      },
      userId: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: User,
            key: "id",
         },
      },
      prompt: {
         type: DataTypes.TEXT,
         allowNull: false,
      },
      style: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      imageUrl: {
         type: DataTypes.TEXT,
         allowNull: false,
      },
      s3Key: {
         type: DataTypes.STRING,
         allowNull: true,
      },
      s3Url: {
         type: DataTypes.TEXT,
         allowNull: true,
      },
      mimeType: {
         type: DataTypes.STRING,
         allowNull: true,
         defaultValue: "image/png",
      },
      width: {
         type: DataTypes.INTEGER,
         allowNull: true,
      },
      height: {
         type: DataTypes.INTEGER,
         allowNull: true,
      },
      generationModel: {
         type: DataTypes.STRING,
         allowNull: true,
      },
      generationParameters: {
         type: DataTypes.JSON,
         allowNull: true,
      },
      isPublic: {
         type: DataTypes.BOOLEAN,
         allowNull: false,
         defaultValue: false,
      },
      isFavorite: {
         type: DataTypes.BOOLEAN,
         allowNull: false,
         defaultValue: false,
      },
      albumId: {
         type: DataTypes.UUID,
         allowNull: true,
         references: {
            model: Album,
            key: "id",
         },
      },
      tags: {
         type: DataTypes.JSON,
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
      modelName: "AI_Generated_Arts",
      indexes: [
         {
            fields: ["userId"],
         },
         {
            fields: ["albumId"],
         },
         {
            fields: ["userId", "isFavorite"],
         },
         {
            fields: ["isPublic"],
         },
         {
            fields: ["createdAt"],
         },
         {
            fields: ["style"],
         },
      ],
   }
);

export default AiGeneratedArt;
