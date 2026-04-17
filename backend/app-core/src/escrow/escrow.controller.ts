import { Controller, Post, Body, Get, Param, Request, UseGuards } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { CreateEscrowOrderDto } from './dto/create-escrow-order.dto';
import { EscrowActionDto } from './dto/escrow-action.dto';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';


@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @UseGuards(AuthenticatedGuard)
  @Post('create-order')
  createOrder(
    @Request() req,
    @Body() dto: CreateEscrowOrderDto
  ) {
    dto.email = req.user.email;
    return this.escrowService.createOrder(dto);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('orders')
  getMyOrders(@Request() req) {
    return this.escrowService.getMyOrders(req.user.email);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('provider-orders')
  getProviderOrders(@Request() req) {
    return this.escrowService.getProviderOrders(req.user.email);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('order/:orderId')
  getOrder(
    @Request() req,
    @Param('orderId') orderId: string
  ) {
    return this.escrowService.getOrder(orderId, req.user.email);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('confirm-payment')
  confirmPayment(
    @Request() req,
    @Body() dto: EscrowActionDto
  ) {
    return this.escrowService.confirmPayment(dto.orderId, req.user.email);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('release-funds')
  releaseFunds(
    @Request() req,
    @Body() dto: EscrowActionDto
  ) {
    return this.escrowService.releaseFunds(dto.orderId, req.user.email);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('open-dispute')
  openDispute(
    @Request() req,
    @Body() dto: EscrowActionDto
  ) {
    return this.escrowService.openDispute(dto.orderId, req.user.email, dto.reason);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('cancel-order')
  cancelOrder(
    @Request() req,
    @Body() dto: EscrowActionDto
  ) {
    return this.escrowService.cancelOrder(dto.orderId, req.user.email);
  }
}
