import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeedPost, FeedPostDocument } from '../feed-and-multimedia/schemas/feed.schema';
import { Comment, CommentDocument } from '../feed-and-multimedia/schemas/comment.schema';

@Injectable()
export class FeedRepository {
  constructor(
    @InjectModel(FeedPost.name) private readonly feedModel: Model<FeedPostDocument>,
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
  ) {}



  // DEVUELVE LA REFERENCIA AL MODELO DE DATOS DE LAS PUBLICACIONES DEL FEED
  get feed() {
    return this.feedModel;
  }



  // DEVUELVE LA REFERENCIA AL MODELO DE DATOS DE LOS COMENTARIOS DE LAS PUBLICACIONES
  get comment() {
    return this.commentModel;
  }



  // DEVUELVE LA CONEXION A LA BASE DE DATOS UTILIZADA POR ESTE REPOSITORIO
  get db() {
    return this.feedModel.db;
  }
}

export default FeedRepository;
