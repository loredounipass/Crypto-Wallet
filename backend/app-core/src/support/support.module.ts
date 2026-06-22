import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([{ name: ChatMessage.name, schema: ChatMessageSchema }]),
    ],
    controllers: [SupportController],
    providers: [SupportService],
})
export class SupportModule {}
