import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HashService } from './hash.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { AuthService } from '../auth/auth.service';
import { TwoFactorAuthModule } from '../two-factor/verification.module';
import { EmailModule } from './email.module';
import { ForgotPasswordService } from './forgot.password.service';
import { UserRepository } from '../repositories/user.repository';
import { SharedProfileModule } from '../profile/shared-profile.module';

@Module({
  imports: [
    EmailModule,
    TwoFactorAuthModule,
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }]),
    SharedProfileModule
  ],
  controllers: [UserController],
  providers: [
    UserRepository,
    UserService,
    HashService,
    AuthService,
    ForgotPasswordService
  ],
  exports: [UserService, HashService, UserRepository, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])], 
})
export class UserModule { }
