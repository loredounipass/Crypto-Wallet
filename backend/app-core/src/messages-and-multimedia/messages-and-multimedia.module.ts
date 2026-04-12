import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesAndMultimediaService } from './messages-and-multimedia.service';
import { MessagesAndMultimediaController } from './messages-and-multimedia.controller';
import { AppMessage, AppMessageSchema } from './schemas/message.schema';
import { Multimedia, MultimediaSchema } from './schemas/multimedia.schema';
import { MessagesGateway } from './messages.gateway';
import { UserModule } from '../user/user.module';
import { BullModule } from '@nestjs/bull';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import { MultimediaProcessor } from './messages-and-multimedia.processor';
import { MultimediaRepository } from 'src/repositories/multimedia.repository';
import { MessageRepository } from 'src/repositories/message.repository';

export { MultimediaRepository, MessageRepository };

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppMessage.name, schema: AppMessageSchema },
      { name: Multimedia.name, schema: MultimediaSchema },
    ]),
    BullModule.registerQueue({ name: 'multimedia' }),
    forwardRef(() => UserModule),
  ],
  controllers: [MessagesAndMultimediaController],
  providers: [MessagesAndMultimediaService, MessagesGateway, LocalStorageProvider, MultimediaProcessor, MultimediaRepository, MessageRepository],
  exports: [MultimediaRepository, MessageRepository],
})
export class MessagesAndMultimediaModule {}
