import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TwoFactorAuthService } from './verification.service';
import { TokenSchema } from './schemas/verification.schema';
import { TokenRepository } from './token.repository';
import { EmailModule } from '../user/email.module';

export { TokenRepository, TwoFactorAuthService };

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Token', schema: TokenSchema }]),
    EmailModule,
  ],
  providers: [TwoFactorAuthService, TokenRepository],
  exports: [TwoFactorAuthService, TokenRepository],
})
export class TwoFactorAuthModule {}
