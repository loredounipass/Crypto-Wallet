import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';

@Module({
  imports: [ConfigModule],
  providers: [DonationsService],
  controllers: [DonationsController],
})
export class DonationsModule {}
