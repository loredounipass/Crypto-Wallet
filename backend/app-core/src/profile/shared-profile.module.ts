import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { ProfileRepository } from '../repositories/profile.repository';

/**
 * Shared module that provides ProfileRepository without creating
 * a circular dependency between UserModule and ProfileModule.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
    ]),
  ],
  providers: [ProfileRepository],
  exports: [ProfileRepository, MongooseModule],
})
export class SharedProfileModule {}
