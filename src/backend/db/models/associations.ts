import Album from './album';
import Image from './images';
import CreateAlbum from './createalbum';
import Book from './book';
import Layout from './layout';
import User from './user';
import Cart from './cart';

Album.hasMany(Image, {
  foreignKey: 'albumId',
  as: 'images',
});

Image.belongsTo(Album, {
  foreignKey: 'albumId',
  as: 'album',
});

CreateAlbum.belongsTo(Album, {
  foreignKey: 'albumId',
  as: 'album',
});

Book.belongsTo(Album, {
  foreignKey: 'albumId',
  as: 'album',
});

Layout.belongsTo(Album, {
  foreignKey: 'albumId',
  as: 'album',
});

// Define associations
Cart.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Cart.belongsTo(Album, {
  foreignKey: 'albumId',
  as: 'album',
});
