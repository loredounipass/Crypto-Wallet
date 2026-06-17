import { Module } from '@nestjs/common';
import { PriceController } from './price.controller';

@Module({
  controllers: [PriceController],
})
export class PriceModule {}
