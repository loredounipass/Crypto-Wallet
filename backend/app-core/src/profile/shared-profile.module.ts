import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { ProfileRepository } from '../repositories/profile.repository';

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
