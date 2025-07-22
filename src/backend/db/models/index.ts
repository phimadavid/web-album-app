import { sequelize, Sequelize } from './db';
import Album from './album';
import Image from './images';
import User from './user';
import CreateAlbum from './createalbum';
import Book from './book';
import Layout from './layout';
import Cart from './cart';
import AiGeneratedArt from './aiGeneratedArt';
import AiArtCart from './aiArtCart';
import './associations';
/* -- 
 dre ma export tanan ang mga models para dali ra tawagon....
-- */

export default {
  // diri ma export tanan ang models..
  sequelize,
  Sequelize,
  User,
  Album,
  Image,
  CreateAlbum,
  Book,
  Layout,
  Cart,
  AiGeneratedArt,
  AiArtCart,
};
