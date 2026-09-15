import { Injectable, InternalServerErrorException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TokenRepository } from './token.repository';
import { EmailService } from '../user/email.service';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

@Injectable()
export class TwoFactorAuthService {
  private readonly TOKEN_EXPIRY_MS = 5 * 60 * 1000;
  private readonly COOLDOWN_MS = 60 * 1000;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_MS = 15 * 60 * 1000; // VULN-04 FIX: 15 min lockout after max attempts

  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly emailService: EmailService,
  ) {}



  // ACTIVA EL PROCESO DE GENERACION Y ENVIO DE UN NUEVO TOKEN DE AUTENTICACION AL CORREO DEL USUARIO
  sendToken(toEmail: string): Promise<{ message: string }> {
    return this.createAndSendToken(toEmail);
  }



  // VULN-04 FIX: Added temporal lockout after MAX_ATTEMPTS.
  // VALIDA EL TOKEN RECIBIDO CONTRA EL ALMACENADO PREVINIENDO ATAQUES DE TIEMPO Y LIMITANDO LOS INTENTOS FALLIDOS
  async verifyToken(toEmail: string, token: string): Promise<{ isValid: boolean; message: string }> {
    try {
      const tokenEntry = await this.tokenRepository.findOne({ email: toEmail });
      const DUMMY_HASH = bcrypt.hashSync('000000', 12);
      if (!tokenEntry) {
        await bcrypt.compare(token, DUMMY_HASH);
        return { isValid: false, message: 'Invalid or expired token' };
      }
      if (tokenEntry.isValid) {
        return { isValid: false, message: 'Token already validated' };
      }
      // VULN-04 FIX: Enforce temporal lockout after exceeding max attempts
      if ((tokenEntry.attempts || 0) >= this.MAX_ATTEMPTS) {
        const lockoutEnd = (tokenEntry.lastAttemptAt || 0) + this.LOCKOUT_MS;
        if (Date.now() < lockoutEnd) {
          const remainingMin = Math.ceil((lockoutEnd - Date.now()) / 60000);
          return { isValid: false, message: `Account locked. Try again in ${remainingMin} minute(s).` };
        }
        // Lockout period has passed — reset attempts
        await this.tokenRepository.findOneAndUpdate(
          { _id: tokenEntry._id },
          { $set: { attempts: 0, lastAttemptAt: null } }
        );
        tokenEntry.attempts = 0;
      }
      const isMatch = await bcrypt.compare(token, tokenEntry.tokenHash);
      if (!isMatch) {
        await this.tokenRepository.findOneAndUpdate(
          { _id: tokenEntry._id, isValid: false },
          { $inc: { attempts: 1 }, $set: { lastAttemptAt: Date.now() } }
        );
        return { isValid: false, message: 'Invalid or expired token' };
      }
      const updated = await this.tokenRepository.findOneAndUpdate(
        { _id: tokenEntry._id, isValid: false, attempts: { $lt: this.MAX_ATTEMPTS } },
        { $set: { isValid: true } },
        { returnDocument: 'after' }
      );
      if (!updated) {
        return { isValid: false, message: 'Token already validated or invalid' };
      }
      return { isValid: true, message: 'Token validated successfully' };
    } catch (error) {
      console.error('Error in token verification', error);
      throw new InternalServerErrorException('Error verifying token.');
    }
  }



  // REENVIA UN NUEVO TOKEN DE SEGURIDAD GARANTIZANDO QUE HAYA PASADO EL TIEMPO MINIMO DE ESPERA
  resendToken(toEmail: string): Promise<{ message: string }> {
    return this.createAndSendToken(toEmail);
  }



  // CREA UN CODIGO DE SEIS DIGITOS LO ENCRIPTA ACTUALIZA LA BASE DE DATOS Y LO ENVIA POR CORREO ELECTRONICO
  private async createAndSendToken(toEmail: string): Promise<{ message: string }> {
    try {
      const now = Date.now();
      const existing = await this.tokenRepository.findOne({ email: toEmail });
      if (existing) {
        if (existing.lastSentAt && (now - existing.lastSentAt) < this.COOLDOWN_MS) {
          const remainingMs = this.COOLDOWN_MS - (now - existing.lastSentAt);
          const remainingSec = Math.ceil(remainingMs / 1000);
          throw new BadRequestException(`You must wait ${remainingSec} seconds before requesting another token.`);
        }
        
        // VULN-04 FIX: Prevenir que resendToken se salte el bloqueo (Lockout Bypass)
        if ((existing.attempts || 0) >= this.MAX_ATTEMPTS) {
          const lockoutEnd = (existing.lastAttemptAt || 0) + this.LOCKOUT_MS;
          if (now < lockoutEnd) {
            const remainingMin = Math.ceil((lockoutEnd - now) / 60000);
            throw new UnauthorizedException(`Account locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`);
          }
        }
      }
      const token = String(randomInt(0, 1000000)).padStart(6, '0');
      const tokenHash = await bcrypt.hash(token, 12);
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
      return { message: 'Token sent successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error creating/sending token', error);
      throw new InternalServerErrorException('Error sending the token.');
    }
  }
}
