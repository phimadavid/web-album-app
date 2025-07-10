import {
  Model,
  DataTypes,
  InferCreationAttributes,
  InferAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from './db';
import User from './user';
import Album from './album';

class Cart extends Model<InferAttributes<Cart>, InferCreationAttributes<Cart>> {
  declare readonly id: CreationOptional<string>;
  declare userId: number;
  declare albumId: string;
  declare quantity: number;
  declare bookFormat: string;
  declare coverType: 'softcover' | 'hardcover' | 'dutch';
  declare pageCount: number;
  declare shippingOption: string;
  declare price: number;
  declare shippingPrice: number;
  declare totalPrice: number;
  declare customizations: Record<string, any>;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Cart.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    albumId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Album,
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    bookFormat: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          [
            'mini-magnifier',
            'large-panoramic',
            'classic',
            'classic-plus',
            'large-square',
            'small-square',
          ],
        ],
      },
    },
    coverType: {
      type: DataTypes.ENUM('softcover', 'hardcover', 'dutch'),
      allowNull: false,
    },
    pageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24,
      validate: {
        min: 24,
      },
    },
    shippingOption: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          [
            'asphalt-collection',
            'delivery-points',
            'home-delivery',
            'certified-mail',
          ],
        ],
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shippingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    customizations: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
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
    modelName: 'Cart',
    timestamps: true,
  }
);

export default Cart;
