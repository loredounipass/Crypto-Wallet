import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProviderDocument = Provider & Document;

@Schema()
export class Provider {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  idNumber: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  streetName: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ default: '', required: false }) 
  photo?: string;

  @Prop({ default: false })
  isValid: boolean;

  @Prop({ type: [String], default: [] })
  paymentMethods: string[];

  @Prop({ default: '' })
  walletAddress: string;

  @Prop({ default: 0 })
  completedOrders: number;

  @Prop({ default: 0 })
  totalTradeVolume: number;

  _id?: string; 

  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);