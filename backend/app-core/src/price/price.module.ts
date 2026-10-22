import { Module } from '@nestjs/common';
import { CoinbasePriceClient } from './coinbase.client';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';

@Module({
  controllers: [PriceController],
  providers: [PriceService, CoinbasePriceClient],
  exports: [PriceService],
})
export class PriceModule {}
