import { Controller, Get, Post, Body, Request, UseGuards, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { QueryDto } from './dto/query.dto';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';
import { WithdrawDto } from './dto/withdraw.dto';
import { TokenWithdrawDto } from './dto/token-withdraw.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }



  // CREA UNA NUEVA BILLETERA PARA EL USUARIO O DEVUELVE LA EXISTENTE SI YA TIENE UNA EN ESA RED
  @UseGuards(AuthenticatedGuard)
  @Post('create')
  createWallet(
    @Request() req,
    @Body() createWalletDto: CreateWalletDto
  ) {
    createWalletDto.email = req.user.email;
    return this.walletService.create(createWalletDto);
  }



  // OBTIENE LA INFORMACION DETALLADA DE UNA BILLETERA ESPECIFICA DEL USUARIO MEDIANTE UN FILTRO
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



  // RECUPERA EL LISTADO COMPLETO DE TODAS LAS BILLETERAS ASOCIADAS A LA CUENTA DEL USUARIO ACTUAL
  @UseGuards(AuthenticatedGuard)
  @Get('all')
  wallets(@Request() req) {
    return this.walletService.getWallets(req.user.email);
  }



  // CONSULTA Y RETORNA LOS SALDOS DISPONIBLES DE TODOS LOS TOKENS ERC20 EN LAS BILLETERAS DEL USUARIO
  @UseGuards(AuthenticatedGuard)
  @Get('tokens')
  tokenBalances(@Request() req) {
    return this.walletService.getTokenBalances(req.user.email);
  }



  // PROCESA UNA SOLICITUD DE RETIRO DE LA MONEDA NATIVA ENVIANDO LOS FONDOS A LA DIRECCION INDICADA
  @UseGuards(AuthenticatedGuard)
  @Post('withdraw')
  withdraw(
    @Request() req,
    @Body() withdrawDto: WithdrawDto
  ) {
    withdrawDto.email = req.user.email;
    return this.walletService.withdraw(withdrawDto);
  }



  // INICIA EL PROCESO DE RETIRO PARA UN TOKEN ERC20 VERIFICANDO QUE EXISTA SALDO SUFICIENTE Y DISPONIBLE
  @UseGuards(AuthenticatedGuard)
  @Post('withdraw-token')
  withdrawToken(
    @Request() req,
    @Body() tokenWithdrawDto: TokenWithdrawDto
  ) {
    tokenWithdrawDto.email = req.user.email;
    return this.walletService.withdrawToken(tokenWithdrawDto);
  }
}
