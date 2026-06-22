import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DonationsService {
  constructor(private readonly configService: ConfigService) {}
  // Reads wallet addresses from environment variables. Keep this file very small
  // so that there's no accidental exposure in the frontend build.
  getWallets() {
    return {
      btc: this.configService.get<string>('BTC_ADDRESS') || null,
      usdt: this.configService.get<string>('USDT_ADDRESS') || null,
    };
  }
}
