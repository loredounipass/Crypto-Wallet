import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
    @Prop({ required: true, index: true })
    userEmail: string;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true })
    response: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
