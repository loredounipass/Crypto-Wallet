import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UserModule } from '../user/user.module';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import { SharedProfileModule } from './shared-profile.module';

@Module({
  imports: [
    SharedProfileModule,
    UserModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService, LocalStorageProvider],
})
export class ProfileModule {}
