import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MultimediaDocument = Multimedia & Document;

@Schema({ timestamps: true })
export class Multimedia {
  @Prop({ required: true })
  url: string;

  @Prop({ enum: ['image', 'video', 'audio'], required: true })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  message?: Types.ObjectId;

  // Processing metadata
  @Prop()
  mimeType?: string;

  @Prop()
  size?: number;

  @Prop()
  duration?: number;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ enum: ['uploading', 'processing', 'ready', 'failed'], default: 'uploading' })
  status?: string;

  @Prop({ type: Object, required: false })
  processingJob?: any;
}

export const MultimediaSchema = SchemaFactory.createForClass(Multimedia);
