import { Module } from '@nestjs/common';
import { BinancePriceClient } from './binance.client';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';

@Module({
  controllers: [PriceController],
  providers: [PriceService, BinancePriceClient],
  exports: [PriceService],
})
export class PriceModule {}
