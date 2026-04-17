import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { ProviderModule } from './providers/provider.module';
import { TwoFactorAuthModule  } from './two-factor/verification.module';
import { ProfileModule } from './profile/profile.module';
import { MessagesAndMultimediaModule } from './messages-and-multimedia/messages-and-multimedia.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EscrowModule } from './escrow/escrow.module';


// This is the main application module that imports and configures various modules such as ConfigModule for environment variables, MongooseModule for MongoDB connection, ThrottlerModule for rate limiting, BullModule for Redis-based queues, and other feature modules like UserModule, WalletModule, AuthModule, TransactionModule, ProviderModule, and TwoFactorAuthModule. It also provides the AppService for handling application-level logic.
@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.RATE_LIMIT_TTL),
      limit: parseInt(process.env.RATE_LIMIT),
    }),
    
    MongooseModule.forRoot(
      process.env.DB_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    ),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
      }
    }),
    UserModule,
    WalletModule,
    AuthModule,
    TransactionModule,
    ProviderModule,
    TwoFactorAuthModule,
    ProfileModule,
    MessagesAndMultimediaModule,
    EventEmitterModule.forRoot(),
    EscrowModule
  ],
  providers: [AppService],
})
export class AppModule { }