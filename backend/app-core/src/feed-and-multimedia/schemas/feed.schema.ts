import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedPostDocument = FeedPost & Document;

@Schema({ timestamps: true })
export class FeedPost {
  @Prop({ required: true })
  description: string;

  @Prop({ enum: ['text', 'image', 'video'], default: 'text' })
  type: string;


  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Multimedia' })
  multimediaId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  likesCount: number;

  @Prop({ type: Number, default: 0 })
  commentsCount: number;

  @Prop({ type: Number, default: 0 })
  shares: number;

  @Prop({ type: Number, default: 0 })
  views: number;

  @Prop({ type: String, required: false })
  authorFirstName?: string;

  @Prop({ type: String, required: false })
  authorLastName?: string;

  @Prop({ type: String, required: false })
  multimediaUrl?: string;

  @Prop({ type: String, required: false })
  thumbnailUrl?: string;

  @Prop({ type: String, required: false })
  multimediaStatus?: string;

  _id?: string;
}

export const FeedPostSchema = SchemaFactory.createForClass(FeedPost);

FeedPostSchema.index({ author: 1, createdAt: -1 });
FeedPostSchema.index({ createdAt: -1 });
FeedPostSchema.index({ multimediaId: 1 });

FeedPostSchema.set('toJSON', {
  transform: function (doc: any, ret: any) {
    ret._id = ret._id?.toString();
    delete ret.__v;
  },
});
