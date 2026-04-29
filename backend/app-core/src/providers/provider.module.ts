import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderService } from './provider.service';
import { ProviderController } from './provider.controller';
import { Provider, ProviderSchema } from './schemas/provider.schema';
import { ProviderTerms, ProviderTermsSchema } from './provider-terms.schema';
import { Chat, ChatSchema } from './schemas/chat-schema/chat.schema';
import { Message, MessageSchema } from './schemas/chat-schema/message.schema';
import { UserModule } from '../user/user.module'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema },
      { name: ProviderTerms.name, schema: ProviderTermsSchema },
      { name: Chat.name, schema: ChatSchema }, 
      { name: Message.name, schema: MessageSchema }, 
    ]),
    UserModule, 
  ],
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}
