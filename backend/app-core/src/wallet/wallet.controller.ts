import { Controller, Get, Post, Body, Request, UseGuards, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { QueryDto } from './dto/query.dto';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';
import { WithdrawDto } from './dto/withdraw.dto';


// This controller handles HTTP requests related to wallets, such as creating a new wallet for a user, retrieving wallet information, and processing withdrawal requests. It uses the WalletService to perform these operations and is protected by an authentication guard to ensure that only authenticated users can access these endpoints.
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }


  // Endpoint to create a new wallet for a user based on the provided email, coin, and chainId. If the user already has a wallet for the specified coin and chainId, it returns the existing wallet information. Otherwise, it reserves a new wallet from the wallet contract collection, creates a new wallet document, and associates it with the user.
  @UseGuards(AuthenticatedGuard)
  @Post('create')
  createWallet(
    @Request() req,
    @Body() createWalletDto: CreateWalletDto
  ) {
    createWalletDto.email = req.user.email;
    return this.walletService.create(createWalletDto);
  }


  // Endpoint to retrieve a specific wallet for a user based on their email, coin, and chainId. It retrieves the wallet information from the user's associated wallets and returns it if found.
  @UseGuards(AuthenticatedGuard)
  @Get('info')
  wallet(
    @Request() req,
    @Query() queryDto: QueryDto
  ) {
    return this.walletService.getWallet(
      req.user.email,
      queryDto
    )
  }


  // Endpoint to retrieve all wallets for a user based on their email. It retrieves the wallet information from the user's associated wallets and returns it as a list.
  @UseGuards(AuthenticatedGuard)
  @Get('all')
  wallets(@Request() req) {
    return this.walletService.getWallets(req.user.email);
  }

  
  // Endpoint to process a withdrawal request for a user based on the provided email, coin, amount, and destination address. It checks if the user has sufficient balance in their wallet, creates a new transaction for the withdrawal, updates the wallet balance, and adds the withdrawal request to a queue for asynchronous processing.
  @UseGuards(AuthenticatedGuard)
  @Post('withdraw')
  withdraw(
    @Request() req,
    @Body() withdrawDto: WithdrawDto
  ) {
    withdrawDto.email = req.user.email;
    return this.walletService.withdraw(withdrawDto);
  }
}
