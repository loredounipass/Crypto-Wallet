import { Controller, Get, Request, UseGuards, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { QueryDto } from './dto/query.dto';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }



  // RECUPERA Y DEVUELVE EL HISTORIAL COMPLETO DE TRANSACCIONES DEL USUARIO FILTRADO POR LA CRIPTOMONEDA ESPECIFICADA
  @UseGuards(AuthenticatedGuard)
  @Get('all')
  transactions(
    @Request() req,
    @Query() queryDto: QueryDto
  ) {
    return this.transactionService.getTransactions(
      req.user.email,
      queryDto
    )
  }



  // OBTIENE LA INFORMACION DETALLADA DE UNA TRANSACCION ESPECIFICA ASEGURANDO QUE PERTENEZCA AL USUARIO ACTUAL
  @UseGuards(AuthenticatedGuard)
  @Get('info')
  transaction(@Request() req, @Query() queryDto: QueryDto) {
    return this.transactionService.getTransaction(req.user.email, queryDto)
  }
}