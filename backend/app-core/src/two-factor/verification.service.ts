import { Injectable, InternalServerErrorException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TokenRepository } from './token.repository';
import { EmailService } from '../user/email.service';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

@Injectable()
export class TwoFactorAuthService {
  private readonly TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos
  private readonly COOLDOWN_MS = 60 * 1000; // 1 minuto entre envíos
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly emailService: EmailService,
  ) {}


  //Methods for 2FA token management
  sendToken(toEmail: string): Promise<{ message: string }> {
    return this.createAndSendToken(toEmail);
  }


  // Verify the token provided by the user
  async verifyToken(toEmail: string, token: string): Promise<{ isValid: boolean; message: string }> {
    try {
      // atomic-safe token verification to avoid race conditions
      const tokenEntry = await this.tokenRepository.findOne({ email: toEmail });

      // Dummy hash to equalize timing when tokenEntry is missing
      const DUMMY_HASH = bcrypt.hashSync('000000', 12);

      if (!tokenEntry) {
        // Perform a dummy compare to mitigate timing attacks
        await bcrypt.compare(token, DUMMY_HASH);
        return { isValid: false, message: 'Token inválido o expirado' };
      }

      if (tokenEntry.isValid) {
        return { isValid: false, message: 'Token ya validado' };
      }

      if ((tokenEntry.attempts || 0) >= this.MAX_ATTEMPTS) {
        return { isValid: false, message: 'Demasiados intentos. Intenta más tarde.' };
      }

      const isMatch = await bcrypt.compare(token, tokenEntry.tokenHash);
      if (!isMatch) {
        // increment attempts atomically
        await this.tokenRepository.findOneAndUpdate(
          { _id: tokenEntry._id, isValid: false, attempts: { $lt: this.MAX_ATTEMPTS } },
          { $inc: { attempts: 1 } }
        );
        return { isValid: false, message: 'Token inválido o expirado' };
      }

      // Try to atomically mark token as used. Only one request will succeed.
      const updated = await this.tokenRepository.findOneAndUpdate(
        { _id: tokenEntry._id, isValid: false, attempts: { $lt: this.MAX_ATTEMPTS } },
        { $set: { isValid: true } },
        { new: true }
      );

      if (!updated) {
        return { isValid: false, message: 'Token ya validado o inválido' };
      }

      return { isValid: true, message: 'Token validado correctamente' };
    } catch (error) {
      console.error('Error en la verificación del token', error);
      throw new InternalServerErrorException('Error en la verificación del token.');
    }
  }


  // Resend a new token to the user, enforcing cooldown
  resendToken(toEmail: string): Promise<{ message: string }> {
    return this.createAndSendToken(toEmail);
  }


  // Internal method to create a new token, save it, and send it via email
  private async createAndSendToken(toEmail: string): Promise<{ message: string }> {
    try {
      const now = Date.now();

      // Find existing token entry for this email
      const existing = await this.tokenRepository.findOne({ email: toEmail });
      if (existing && existing.lastSentAt && (now - existing.lastSentAt) < this.COOLDOWN_MS) {
        const remainingMs = this.COOLDOWN_MS - (now - existing.lastSentAt);
        const remainingSec = Math.ceil(remainingMs / 1000);
        throw new BadRequestException(`Debes esperar ${remainingSec} segundos antes de solicitar otro token.`);
      }

      // Generate a 6-digit token using cryptographically secure random
      const token = String(randomInt(0, 1000000)).padStart(6, '0');
      const tokenHash = await bcrypt.hash(token, 12);

      // Upsert a single active token document per email. This reduces writes and keeps only
      // one token record per user (invalidates previous tokens by replacing them).
      await this.tokenRepository.findOneAndUpdate(
        { email: toEmail },
        {
          email: toEmail,
          tokenHash,
          createdAt: new Date(),
          isValid: false,
          attempts: 0,
          lastSentAt: now,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await this.emailService.sendTokenLogin(toEmail, token);

      return { message: 'Token enviado correctamente' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error al crear/enviar token', error);
      throw new InternalServerErrorException('Error al enviar el token.');
    }
  }
}
