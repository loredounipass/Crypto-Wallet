import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { EscrowGateway } from './escrow.gateway';
import { EscrowStatusProcessor } from './escrow-status.processor';
import { EscrowOrder, EscrowOrderSchema } from './schemas/escrow-order.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import { Provider, ProviderSchema } from '../providers/schemas/provider.schema';
import { Chat, ChatSchema } from '../providers/schemas/chat-schema/chat.schema';
import { Transaction, TransactionSchema } from '../transaction/schemas/transaction.schema';
import { default as EscrowQueueType } from './queue/types.queue';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EscrowOrder.name, schema: EscrowOrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    BullModule.registerQueue({
      name: EscrowQueueType.ESCROW_FUNDING,
    }),
    BullModule.registerQueue({
      name: EscrowQueueType.ESCROW_RELEASE,
    }),
    BullModule.registerQueue({
      name: EscrowQueueType.ESCROW_STATUS_EVENTS,
    }),
  ],
  controllers: [EscrowController],
  providers: [EscrowService, EscrowGateway, EscrowStatusProcessor],
  exports: [EscrowService],
})
export class EscrowModule {}
