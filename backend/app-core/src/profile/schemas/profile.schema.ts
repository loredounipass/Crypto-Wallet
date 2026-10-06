import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  owner: Types.ObjectId;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  profilePhotoUrl?: string;

  @Prop()
  coverPhotoUrl?: string;

  @Prop({ maxlength: 300 })
  bio?: string;

  @Prop({ maxlength: 2 })
  country?: string;

  @Prop({ type: [String], default: [] })
  currencies: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  followers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  following: Types.ObjectId[];
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
