import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProviderTermsDocument = ProviderTerms & Document;

@Schema()
export class ProviderTerms {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: true })
  accepted: boolean;
}

export const ProviderTermsSchema = SchemaFactory.createForClass(ProviderTerms);
