import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedAndMultimediaController } from './feed-and-multimedia.controller';
import { FeedPost, FeedPostSchema } from './schemas/feed.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { Multimedia, MultimediaSchema } from '../messages-and-multimedia/schemas/multimedia.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { MessagesAndMultimediaModule } from '../messages-and-multimedia/messages-and-multimedia.module';
import { FeedGateway } from './feed.gateway';
import { UserModule } from '../user/user.module';
import { BullModule } from '@nestjs/bull';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import { FeedRepository } from './feed.repository';
import { EmailThrottlerGuard } from '../guard/auth/email-throttler.guard';
import { FeedPostsService } from './services/feed-posts.service';
import { FeedCommentsService } from './services/feed-comments.service';
import { FeedInteractionsService } from './services/feed-interactions.service';
import { FeedEventsService } from './services/feed-events.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeedPost.name, schema: FeedPostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Multimedia.name, schema: MultimediaSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MessagesAndMultimediaModule,
    BullModule.registerQueue({ name: 'multimedia' }),
    forwardRef(() => UserModule),
  ],
  controllers: [FeedAndMultimediaController],
  providers: [
    FeedPostsService,
    FeedCommentsService,
    FeedInteractionsService,
    FeedEventsService,
    FeedGateway,
    LocalStorageProvider,
    FeedRepository,
    EmailThrottlerGuard,
  ],
})
export class FeedAndMultimediaModule {}
