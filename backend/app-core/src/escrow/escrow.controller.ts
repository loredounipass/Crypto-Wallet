import { Controller, Post, Body, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { CreateEscrowOrderDto } from './dto/create-escrow-order.dto';
import { EscrowActionDto } from './dto/escrow-action.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';
import { GasEstimateQueryDto } from './dto/gas-estimate-query.dto';

@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}



  // RECIBE LOS DATOS DEL FRONTEND PARA CREAR UNA NUEVA ORDEN P2P Y LA GUARDA EN LA BASE DE DATOS
  @UseGuards(AuthenticatedGuard)
  @Post('create-order')
  createOrder(
    @Request() req,
    @Body() dto: CreateEscrowOrderDto
  ) {
    return this.escrowService.createOrder(dto, req.user.email);
  }



  // OBTIENE TODAS LAS ORDENES EN LAS QUE EL USUARIO ACTUAL ACTUA COMO COMPRADOR O VENDEDOR
  @UseGuards(AuthenticatedGuard)
  @Get('orders')
  getMyOrders(@Request() req) {
    return this.escrowService.getMyOrders(req.user.email);
  }



  // OBTIENE TODAS LAS ORDENES EN LAS QUE EL USUARIO ACTUAL ACTUA COMO PROVEEDOR DE LIQUIDEZ
  @UseGuards(AuthenticatedGuard)
  @Get('provider-orders')
  getProviderOrders(@Request() req) {
    return this.escrowService.getProviderOrders(req.user.email);
  }



  // BUSCA Y DEVUELVE LOS DETALLES DE UNA ORDEN ESPECIFICA SIEMPRE QUE EL USUARIO PERTENEZCA A ELLA
  @UseGuards(AuthenticatedGuard)
  @Get('order/:orderId')
  getOrder(
    @Request() req,
    @Param('orderId') orderId: string
  ) {
    return this.escrowService.getOrder(orderId, req.user.email);
  }



  // PERMITE AL PROVEEDOR DE LIQUIDEZ CONFIRMAR QUE HA RECIBIDO EL PAGO FIAT EN SU CUENTA BANCARIA
  @UseGuards(AuthenticatedGuard)
  @Post('confirm-payment')
  confirmPayment(
    @Request() req,
    @Body() dto: EscrowActionDto
  ) {
    return this.escrowService.confirmPayment(dto.orderId, req.user.email);
  }



  // PERMITE AL VENDEDOR LIBERAR LOS FONDOS EN CRIPTO UNA VEZ QUE CONFIRMA HABER RECIBIDO EL PAGO
  @UseGuards(AuthenticatedGuard)
  @Post('release-funds')
  releaseFunds(
    @Request() req,
    @Body() dto: EscrowActionDto
  ) {
    return this.escrowService.releaseFunds(dto.orderId, req.user.email);
  }



  // PERMITE A CUALQUIERA DE LAS PARTES ABRIR UNA DISPUTA SI HAY UN PROBLEMA DURANTE LA TRANSACCION
  @UseGuards(AuthenticatedGuard)
  @Post('open-dispute')
  openDispute(
    @Request() req,
    @Body() dto: EscrowActionDto
  ) {
    return this.escrowService.openDispute(dto.orderId, req.user.email, dto.reason);
  }



  // CANCELA LA ORDEN Y DEVUELVE LOS FONDOS AL VENDEDOR SI EL PROVEEDOR AUN NO HA CONFIRMADO EL PAGO
  @UseGuards(AuthenticatedGuard)
  @Post('cancel-order')
  cancelOrder(
    @Request() req,
    @Body() dto: EscrowActionDto
  ) {
    return this.escrowService.cancelOrder(dto.orderId, req.user.email);
  }



  // CALCULA Y DEVUELVE UN ESTIMADO DE LAS TARIFAS DE GAS NECESARIAS PARA LA RED SELECCIONADA
  @UseGuards(AuthenticatedGuard)
  @Get('gas-estimate')
  getGasEstimate(@Query() query: GasEstimateQueryDto) {
    return this.escrowService.getGasEstimate(query.coin, query.chainId);
  }



  // DEVUELVE UNA LISTA DE TODAS LAS ORDENES EN DISPUTA EXCLUSIVAMENTE PARA LOS ADMINISTRADORES
  @UseGuards(AuthenticatedGuard)
  @Get('disputed-orders')
  getDisputedOrders(@Request() req) {
    return this.escrowService.getDisputedOrders(req.user.email);
  }



  // PERMITE A UN ADMINISTRADOR RESOLVER UNA DISPUTA ENTREGANDO LOS FONDOS A UNA DE LAS PARTES
  @UseGuards(AuthenticatedGuard)
  @Post('resolve-dispute')
  resolveDispute(
    @Request() req,
    @Body() dto: ResolveDisputeDto
  ) {
    return this.escrowService.resolveDispute(dto.orderId, dto.type, req.user.email);
  }
}
