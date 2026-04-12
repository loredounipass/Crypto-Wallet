import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategy/local.strategy';
import { SessionSerializer } from './strategy/session.serializer';
import { UserModule } from '../user/user.module';
import { ProfileModule } from '../profile/profile.module';
import { PassportModule, PassportSerializer } from '@nestjs/passport';
import { TwoFactorAuthModule } from '../two-factor/verification.module'; 
import { EmailModule } from '../user/email.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    ProfileModule,
    PassportModule.register({ session: true, defaultStrategy: 'session' }),
    TwoFactorAuthModule,
    EmailModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    {
      provide: PassportSerializer,
      useClass: SessionSerializer,
    },
  ],
})
export class AuthModule {}
