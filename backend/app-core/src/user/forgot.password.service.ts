import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRepository } from './index';
import { randomBytes } from 'crypto';
import { HashService } from './hash.service';
import { EmailService } from './email.service';

// Service for handling forgot password functionality
@Injectable()
export class ForgotPasswordService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly emailService: EmailService,
  ) {}


  // Handles password reset requests by generating a token, saving it to the user, and sending an email
  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Rate limit: only allow one reset request every 2 minutes
    const now = Date.now();
    const RATE_LIMIT_MS = 2 * 60 * 1000; // 2 minutos
    if (user.resetPasswordLastSentAt && (now - user.resetPasswordLastSentAt) < RATE_LIMIT_MS) {
      const remainingMs = RATE_LIMIT_MS - (now - user.resetPasswordLastSentAt);
      const remainingSec = Math.ceil(remainingMs / 1000);
      throw new BadRequestException(`Debes esperar ${remainingSec} segundos antes de solicitar otro restablecimiento.`);
    }
// Generate a secure random token and save its hash to the user document
    const token = randomBytes(20).toString('hex');
    const expires = new Date(now + RATE_LIMIT_MS); // 2 minutos

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


// Resets the user's password after validating the token and new password
  async resetPassword(email: string, token: string, newPassword: string, confirmNewPassword: string) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (!user.resetPasswordTokenHash || !user.resetPasswordExpires || !user.resetPasswordTokenPurpose) {
      throw new BadRequestException('No hay solicitud de restablecimiento válida');
    }

    if (user.resetPasswordTokenPurpose !== 'reset_password') {
      throw new BadRequestException('Token no válido para esta operación');
    }

    if (user.resetPasswordTokenUsed) {
      throw new BadRequestException('Token ya utilizado');
    }

    const isMatch = await this.hashService.comparePassword(token, user.resetPasswordTokenHash);
    if (!isMatch) {
      throw new BadRequestException('Token inválido');
    }

    // Reject token if password was changed after token was issued
    if (user.lastPasswordChange && user.resetPasswordLastSentAt && user.lastPasswordChange >= user.resetPasswordLastSentAt) {
      throw new BadRequestException('El token ya no es válido porque la contraseña fue cambiada después de emitir el token');
    }

    if (user.resetPasswordExpires.getTime() < Date.now()) {
      throw new BadRequestException('Token expirado');
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    user.password = await this.hashService.hashPassword(newPassword);
    user.resetPasswordTokenUsed = true;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenPurpose = undefined;
    user.resetPasswordExpires = undefined;
    user.lastPasswordChange = Date.now();

    await user.save();

    return { message: 'Contraseña restablecida con éxito' };
  }

}
