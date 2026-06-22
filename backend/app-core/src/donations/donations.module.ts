import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';

@Module({
  providers: [DonationsService],
  controllers: [DonationsController],
})
export class DonationsModule {}
