import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @UseGuards(AuthenticatedGuard)
  @Get('wallets')
  getWallets(@Request() req) {
    return this.donationsService.getWallets();
  }
}
