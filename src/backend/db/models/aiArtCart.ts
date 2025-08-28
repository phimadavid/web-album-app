import {
   Model,
   DataTypes,
   InferCreationAttributes,
   InferAttributes,
   CreationOptional,
} from "sequelize";
import { sequelize } from "./db";
import User from "./user";
import AiGeneratedArt from "./aiGeneratedArt";

class AiArtCart extends Model<
   InferAttributes<AiArtCart>,
   InferCreationAttributes<AiArtCart>
> {
   declare readonly id: CreationOptional<string>;
   declare userId: number;
   declare aiArtId?: string; // Optional - for saved AI art
   declare imageUrl: string; // Direct image URL for unsaved art
   declare prompt: string;
   declare style: string;
   declare quantity: number;
   declare productType: "canvas" | "glass" | "aluminum";
   declare size: "small" | "medium" | "large" | "xlarge" | "xxlarge";
   declare dimensions: string;
   declare price: number;
   declare totalPrice: number;

   declare readonly createdAt: CreationOptional<Date>;
   declare readonly updatedAt: CreationOptional<Date>;
}

AiArtCart.init(
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
      aiArtId: {
         type: DataTypes.UUID,
         allowNull: true,
         references: {
            model: AiGeneratedArt,
            key: "id",
         },
      },
      imageUrl: {
         type: DataTypes.TEXT,
         allowNull: false,
      },
      prompt: {
         type: DataTypes.TEXT,
         allowNull: false,
      },
      style: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      quantity: {
         type: DataTypes.INTEGER,
         allowNull: false,
         defaultValue: 1,
         validate: {
            min: 1,
         },
      },
      productType: {
         type: DataTypes.ENUM("canvas", "glass", "aluminum"),
         allowNull: false,
      },
      size: {
         type: DataTypes.ENUM("small", "medium", "large", "xlarge", "xxlarge"),
         allowNull: false,
      },
      dimensions: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      price: {
         type: DataTypes.DECIMAL(10, 2),
         allowNull: false,
      },
      totalPrice: {
         type: DataTypes.DECIMAL(10, 2),
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
      modelName: "AiArtCart",
      timestamps: true,
   }
);

export default AiArtCart;
