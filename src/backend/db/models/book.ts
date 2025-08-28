import {
   Model,
   DataTypes,
   InferCreationAttributes,
   InferAttributes,
   CreationOptional,
} from "sequelize";
import { sequelize } from "./db";
import Album from "./album";

class Book extends Model<InferAttributes<Book>, InferCreationAttributes<Book>> {
   declare readonly id: CreationOptional<string>;

   declare bookId: string;
   declare albumId: string;
   declare name: string;
   declare previewUrl: string;
   declare theme: string;
   declare style: string;
   declare cover_image_count: number;
   declare templateImage: string;
   declare eventCategory: string;

   declare promptWord: string | null;
   declare colors: string[];
   declare cover_images: string[];
   declare detectedTags: string[];

   declare createdAt: CreationOptional<Date>;
   declare updatedAt: CreationOptional<Date>;
}

Book.init(
   {
      id: {
         type: DataTypes.UUID,
         defaultValue: DataTypes.UUIDV4,
         primaryKey: true,
         allowNull: false,
      },
      bookId: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      albumId: {
         type: DataTypes.UUID,
         allowNull: false,
         references: {
            model: Album,
            key: "id",
         },
      },
      name: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      previewUrl: {
         type: DataTypes.TEXT("long"),
         allowNull: false,
      },
      theme: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      style: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      colors: {
         type: DataTypes.JSON,
         allowNull: false,
      },
      cover_image_count: {
         type: DataTypes.INTEGER,
         allowNull: false,
         defaultValue: 0,
      },
      cover_images: {
         type: DataTypes.JSON,
         allowNull: false,
      },
      templateImage: {
         type: DataTypes.TEXT("long"),
         allowNull: false,
      },
      eventCategory: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      promptWord: {
         type: DataTypes.STRING,
         allowNull: true,
      },
      detectedTags: {
         type: DataTypes.JSON,
         allowNull: true,
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
      modelName: "books",
      timestamps: true,
   }
);

export default Book;
