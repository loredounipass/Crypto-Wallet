import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UserModule } from '../user/user.module';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import { SharedProfileModule } from './shared-profile.module';
import { FeedPost, FeedPostSchema } from '../feed-and-multimedia/schemas/feed.schema';
import { Provider, ProviderSchema } from '../providers/schemas/provider.schema';

@Module({
  imports: [
    SharedProfileModule,
    MongooseModule.forFeature([
      { name: FeedPost.name, schema: FeedPostSchema },
      { name: Provider.name, schema: ProviderSchema },
    ]),
    forwardRef(() => UserModule),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, LocalStorageProvider],
})
export class ProfileModule {}
