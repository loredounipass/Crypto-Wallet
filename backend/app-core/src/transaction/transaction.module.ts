import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { HashService } from '../user/hash.service';
import { TwoFactorAuthModule } from 'src/two-factor/verification.module';
import { EmailModule } from 'src/user/email.module';
import { BullModule } from '@nestjs/bullmq';
import QueueType from '../wallet/queue/types.queue';
import { TransactionGateway } from './transaction.gateway';
import { TransactionStatusProcessor } from './transaction-status.processor';

@Module({
  imports: [
    TwoFactorAuthModule,
    UserModule,
    EmailModule,
    BullModule.registerQueue({
      name: QueueType.TRANSACTION_STATUS_EVENTS
    }),
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
    ])
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionGateway,
    TransactionStatusProcessor
  ],
  exports: [TransactionGateway]
})
export class TransactionModule { }
