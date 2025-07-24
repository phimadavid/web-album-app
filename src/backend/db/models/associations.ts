import Album from "./album";
import Image from "./images";
import CreateAlbum from "./createalbum";
import Book from "./book";
import Layout from "./layout";
import User from "./user";
import Cart from "./cart";
import AiGeneratedArt from "./aiGeneratedArt";
import AiArtCart from "./aiArtCart";
import Order from "./order";

Album.hasMany(Image, {
  foreignKey: "albumId",
  as: "images",
});

Image.belongsTo(Album, {
  foreignKey: "albumId",
  as: "album",
});

CreateAlbum.belongsTo(Album, {
  foreignKey: "albumId",
  as: "album",
});

Book.belongsTo(Album, {
  foreignKey: "albumId",
  as: "album",
});

Layout.belongsTo(Album, {
  foreignKey: "albumId",
  as: "album",
});

// Define associations
Cart.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Cart.belongsTo(Album, {
  foreignKey: "albumId",
  as: "album",
});

// AI Generated Art associations
AiGeneratedArt.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(AiGeneratedArt, {
  foreignKey: "userId",
  as: "aiGeneratedArts",
});

AiGeneratedArt.belongsTo(Album, {
  foreignKey: "albumId",
  as: "album",
});

Album.hasMany(AiGeneratedArt, {
  foreignKey: "albumId",
  as: "aiGeneratedArts",
});

// AI Art Cart associations
AiArtCart.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(AiArtCart, {
  foreignKey: "userId",
  as: "aiArtCartItems",
});

AiArtCart.belongsTo(AiGeneratedArt, {
  foreignKey: "aiArtId",
  as: "aiGeneratedArt",
});

AiGeneratedArt.hasMany(AiArtCart, {
  foreignKey: "aiArtId",
  as: "cartItems",
});

// Order associations
Order.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Order, {
  foreignKey: "userId",
  as: "orders",
});
