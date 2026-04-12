import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HashService } from './hash.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { AuthService } from '../auth/auth.service';
import { TwoFactorAuthModule } from 'src/two-factor/verification.module';
import { EmailModule } from './email.module';
import { ForgotPasswordService } from './forgot.password.service';
import { UserRepository } from 'src/repositories/user.repository';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [
    EmailModule,
    TwoFactorAuthModule,
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }]),
    forwardRef(() => ProfileModule)
  ],
  controllers: [UserController],
  providers: [
    UserRepository,
    UserService,
    HashService,
    AuthService,
    ForgotPasswordService
  ],
  exports: [UserService, HashService, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])], 
})
export class UserModule { }
