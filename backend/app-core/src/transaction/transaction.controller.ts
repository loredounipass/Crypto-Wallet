import { Controller, Get, Request, UseGuards, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { QueryDto } from './dto/query.dto';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';


// This controller handles HTTP requests related to transactions, such as retrieving specific transactions and fetching all transactions for a user based on their email and the specified coin. It uses the TransactionService to perform these operations and is protected by an authentication guard to ensure that only authenticated users can access these endpoints.
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }


  // Endpoint to retrieve all transactions for a user based on their email and the specified coin
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


  // Endpoint to retrieve a specific transaction by its ID
  @UseGuards(AuthenticatedGuard)
  @Get('info')
  transaction(@Request() req, @Query() queryDto: QueryDto) {
    return this.transactionService.getTransaction(req.user.email, queryDto)
  }

}