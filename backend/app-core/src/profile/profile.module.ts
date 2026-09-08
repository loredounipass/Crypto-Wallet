import { Module, forwardRef } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UserModule } from '../user/user.module';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import { SharedProfileModule } from './shared-profile.module';

@Module({
  imports: [
    SharedProfileModule,
    forwardRef(() => UserModule),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, LocalStorageProvider],
})
export class ProfileModule {}
