import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { randomBytes } from 'crypto';
import { HashService } from './hash.service';
import { EmailService } from './email.service';

@Injectable()
export class ForgotPasswordService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly emailService: EmailService,
  ) {}



  // GENERA Y GUARDA UN TOKEN UNICO Y SEGURO ENVIANDOLO POR CORREO PARA INICIAR LA RECUPERACION DE CONTRASENA
  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const now = Date.now();
    const RATE_LIMIT_MS = 2 * 60 * 1000;
    if (user.resetPasswordLastSentAt && (now - user.resetPasswordLastSentAt) < RATE_LIMIT_MS) {
      const remainingMs = RATE_LIMIT_MS - (now - user.resetPasswordLastSentAt);
      const remainingSec = Math.ceil(remainingMs / 1000);
      throw new BadRequestException(`You must wait ${remainingSec} seconds before requesting another reset.`);
    }
    const token = randomBytes(20).toString('hex');
    const expires = new Date(now + RATE_LIMIT_MS);
    const tokenHash = await this.hashService.hashPassword(token);
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordTokenPurpose = 'reset_password';
    user.resetPasswordTokenUsed = false;
    user.resetPasswordExpires = expires;
    user.resetPasswordLastSentAt = now;
    await user.save();
    await this.emailService.sendForgotPasswordEmail(user.email, token);
    return true;
  }



  // VERIFICA EL TOKEN DE RECUPERACION Y CAMBIA LA CONTRASENA SI TODAS LAS RESTRICCIONES DE SEGURIDAD SE CUMPLEN
  async resetPassword(email: string, token: string, newPassword: string, confirmNewPassword: string) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!user.resetPasswordTokenHash || !user.resetPasswordExpires || !user.resetPasswordTokenPurpose) {
      throw new BadRequestException('No valid reset request');
    }
    if (user.resetPasswordTokenPurpose !== 'reset_password') {
      throw new BadRequestException('Token not valid for this operation');
    }
    if (user.resetPasswordTokenUsed) {
      throw new BadRequestException('Token already used');
    }
    const isMatch = await this.hashService.comparePassword(token, user.resetPasswordTokenHash);
    if (!isMatch) {
      throw new BadRequestException('Invalid token');
    }
    if (user.lastPasswordChange && user.resetPasswordLastSentAt && user.lastPasswordChange >= user.resetPasswordLastSentAt) {
      throw new BadRequestException('The token is no longer valid because the password was changed after the token was issued');
    }
    if (user.resetPasswordExpires.getTime() < Date.now()) {
      throw new BadRequestException('Token expired');
    }
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    user.password = await this.hashService.hashPassword(newPassword);
    user.resetPasswordTokenUsed = true;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenPurpose = undefined;
    user.resetPasswordExpires = undefined;
    user.lastPasswordChange = Date.now();
    await user.save();
    return { message: 'Password reset successfully' };
  }
}
