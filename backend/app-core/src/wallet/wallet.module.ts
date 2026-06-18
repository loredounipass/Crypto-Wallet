import { EmailModule } from './../user/email.module';
import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { WalletContract, WalletContractSchema } from './schemas/wallet-contract.schema';
import { Erc20Ledger, Erc20LedgerSchema } from './schemas/erc20-ledger.schema';
import { HashService } from '../user/hash.service';
import { AuthService } from '../auth/auth.service';
import { BullModule } from '@nestjs/bullmq';
import { default as QueueType } from './queue/types.queue'
import { Transaction, TransactionSchema } from '../transaction/schemas/transaction.schema';
import { TwoFactorAuthModule } from 'src/two-factor/verification.module';

@Module({
  imports: [
    UserModule,
    TwoFactorAuthModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: WalletContract.name, schema: WalletContractSchema },
      { name: Erc20Ledger.name, schema: Erc20LedgerSchema }
    ]),
    BullModule.registerQueue({
      name: QueueType.WITHDRAW_REQUEST
    }),
    BullModule.registerQueue({
      name: QueueType.TRANSACTION_STATUS_EVENTS
    }),
    BullModule.registerQueue({
      name: QueueType.WITHDRAW_TOKEN_REQUEST
    })
  ],
  controllers: [WalletController],
  providers: [
    WalletService
  ]
})
export class WalletModule { }
