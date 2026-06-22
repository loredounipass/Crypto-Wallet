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

  get feed() {
    return this.feedModel;
  }

  get comment() {
    return this.commentModel;
  }

  get db() {
    return this.feedModel.db;
  }
}

export default FeedRepository;
