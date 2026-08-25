import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { HashService } from './hash.service';
import * as crypto from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile';
import { EmailService } from './email.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly hashService: HashService,
    private readonly emailService: EmailService
  ) {}



  // BUSCA EN LA BASE DE DATOS Y DEVUELVE LA INFORMACION DEL USUARIO QUE COINCIDA EXACTAMENTE CON EL CORREO INDICADO
  getUserByEmail(email: string) {
    return this.userRepository.findOne({ email });
  }



  // LOCALIZA Y RETORNA EL DOCUMENTO COMPLETO DE UN USUARIO UTILIZANDO UNICAMENTE SU IDENTIFICADOR UNICO
  getUserById(id: string) {
    return this.userRepository.findById(id);
  }



  // VALIDA LOS DATOS ENCRIPTA LA CONTRASENA Y GUARDA UN NUEVO REGISTRO DE USUARIO EN EL SISTEMA
  async register(createUserDto: CreateUserDto) {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }
    const user = await this.getUserByEmail(createUserDto.email);
    if (user) {
      throw new BadRequestException("This email is already registered");
    }
    const createUser = {
      ...createUserDto,
      password: await this.hashService.hashPassword(createUserDto.password),
    };
    return this.userRepository.create(createUser);
  }



  // COMPRUEBA SI LA CUENTA ASOCIADA AL CORREO DEL USUARIO YA HA SIDO CONFIRMADA MEDIANTE EL ESTADO INTERNO
  async isEmailVerified(email: string): Promise<{ isVerified: boolean; message: string }> {
    const user = await this.getUserByEmail(email);
    if (!user) {
        throw new BadRequestException('The user with the provided email does not exist.');
    }
    if (user.isValid) {
        return { isVerified: true, message: 'Email verified successfully.' };
    } else {
        return { isVerified: false, message: 'The email is not yet verified.' };
    }
  }



  // COMPARA EL TOKEN ENVIADO CON EL REGISTRADO Y MARCA LA CUENTA COMO VERIFICADA SI SON IGUALES
  async verifyEmail(email: string, token: string): Promise<boolean> {
  const user = await this.getUserByEmail(email);
  if (!user) {
      throw new BadRequestException('User does not exist.');
  }
  if (user.isValid) {
      throw new BadRequestException('Email already verified.');
  }
  if (!user.verifyEmailTokenHash || !user.verifyEmailExpires || user.verifyEmailExpires < new Date()) {
      throw new BadRequestException('The token is invalid or has expired.');
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (user.verifyEmailTokenHash !== tokenHash) {
      throw new BadRequestException('The token is invalid or has expired.');
  }
  try {
      user.isValid = true;
      user.verifyEmailTokenHash = undefined;
      user.verifyEmailExpires = undefined;
      await user.save();
      return true;
  } catch {
      throw new BadRequestException('Error verifying email.');
  }
}



  // CREA Y GUARDA UN NUEVO CODIGO TEMPORAL PARA LUEGO ENVIARLO AL CORREO ELECTRONICO DEL USUARIO SOLICITANTE
  async sendVerificationEmail(email: string): Promise<boolean> {
  const user = await this.getUserByEmail(email);
  if (!user) {
      throw new BadRequestException('User does not exist.');
  }
  if (user.isValid) {
      throw new BadRequestException('Email already verified. Cannot resend.');
  }
  try {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user.verifyEmailTokenHash = tokenHash;
      user.verifyEmailExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await this.emailService.sendVerificationEmail(user.email, token);
      return true;
  } catch {
      throw new BadRequestException('Error sending email.');
  }
}



  // MODIFICA DIRECTAMENTE EN LA BASE DE DATOS LA OPCION PARA EXIGIR UN CODIGO ADICIONAL AL INICIAR SESION
  async updateTokenStatus(email: string, isTokenEnabled: boolean) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    user.isTokenEnabled = isTokenEnabled;
    await user.save();
    return { msg: 'Account security updated successfully.' };
  }



  // REVISA Y DEVUELVE SI EL USUARIO TIENE ACTUALMENTE ACTIVADA O DESACTIVADA LA AUTENTICACION EN DOS PASOS
  async getTokenStatus(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return { isTokenEnabled: !!user.isTokenEnabled };
  }



  // CAMBIA LA PREFERENCIA DE IDIOMA EN EL REGISTRO DEL USUARIO PARA PERSONALIZAR LA INTERFAZ A FUTURO
  async updateLanguage(email: string, language: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    user.language = language;
    await user.save();
    return { msg: 'Language updated successfully.' };
  }



  // EXTRAE DEL DOCUMENTO DEL USUARIO SU IDIOMA CONFIGURADO O DEVUELVE ESPANOL COMO VALOR PREDETERMINADO
  async getUserLanguage(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return { language: user.language || 'es' };
  }



  // VALIDA LA CONTRASENA ACTUAL APLICA RESTRICCIONES DE TIEMPO Y GUARDA LA NUEVA CLAVE DE FORMA SEGURA
  async changePassword(email: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordValid = await this.hashService.comparePassword(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const isSameAsCurrent = await this.hashService.comparePassword(changePasswordDto.newPassword, user.password);
    if (isSameAsCurrent) {
      throw new BadRequestException('The new password cannot be the same as the previous one');
    }
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    if (user.lastPasswordChange) {
      const elapsed = Date.now() - user.lastPasswordChange;
      if (elapsed < TEN_MINUTES_MS) {
        const remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / (60 * 1000));
        throw new BadRequestException(`You cannot change the password until ${remainingMinutes} minute(s) have passed since the last change.`);
      }
    }
    if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword) {
      throw new BadRequestException('The new passwords do not match');
    }
    user.password = await this.hashService.hashPassword(changePasswordDto.newPassword);
    user.lastPasswordChange = Date.now();
    await user.save();
    return { message: 'Password updated successfully' };
  }



  // VERIFICA RESTRICCIONES TEMPORALES Y ACTUALIZA LOS DATOS PERSONALES DEL USUARIO ACTUALIZANDO TAMBIEN LA SESION ACTIVA
  async updateProfile(email: string, updateProfileDto: UpdateProfileDto, req?: any) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    if (user.lastProfileUpdate) {
      const elapsed = Date.now() - user.lastProfileUpdate;
      if (elapsed < TEN_MINUTES_MS) {
        const remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / (60 * 1000));
        throw new BadRequestException(`You cannot update your profile until ${remainingMinutes} minute(s) have passed since the last update.`);
      }
    }
    const providedFirstName = updateProfileDto.firstName !== undefined && updateProfileDto.firstName !== null;
    const providedLastName = updateProfileDto.lastName !== undefined && updateProfileDto.lastName !== null;
    const providedEmail = updateProfileDto.email !== undefined && updateProfileDto.email !== null;
    const firstNameChanged = providedFirstName && updateProfileDto.firstName !== user.firstName;
    const lastNameChanged = providedLastName && updateProfileDto.lastName !== user.lastName;
    const emailChanged = providedEmail && updateProfileDto.email !== user.email;
    if (!firstNameChanged && !lastNameChanged && !emailChanged) {
      if ((providedFirstName || providedLastName) && !providedEmail) {
        throw new BadRequestException('You must use different names than the previous one');
      } else if (providedEmail && !providedFirstName && !providedLastName) {
        throw new BadRequestException('You must use a different email than the previous one');
      } else {
        throw new BadRequestException('You must provide different values than the current ones');
      }
    }
    if (providedEmail && emailChanged) {
      const existingUser = await this.userRepository.findOne({ email: updateProfileDto.email });
      if (existingUser && existingUser.email !== email) {
        throw new BadRequestException('The email is already in use');
      }
      user.email = updateProfileDto.email!;
      user.isValid = false;
    }
    if (firstNameChanged) user.firstName = updateProfileDto.firstName!;
    if (lastNameChanged) user.lastName = updateProfileDto.lastName!;
    user.lastProfileUpdate = Date.now();
    await user.save();
    const result = { message: 'Profile updated successfully' };
    if (req) {
      const updatedUser = await this.getUserByEmail(updateProfileDto.email || email);
      if (!updatedUser) {
        throw new BadRequestException('Error updating user session.');
      }
      return new Promise((resolve, reject) => {
        req.login(updatedUser, (err) => {
          if (err) {
            reject(new BadRequestException('Error updating user session.'));
          } else {
            resolve(result);
          }
        });
      });
    }
    return result;
  }



  // LOCALIZA USUARIOS LIMITADOS EN CANTIDAD BASANDOSE EN EXPRESIONES REGULARES E INCLUYE SUS FOTOS DE PERFIL SI EXISTEN
  async searchUsers(q: string) {
    if (!q) return [];
    const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!sanitized) return [];
    const regex = new RegExp(sanitized, 'i');
    const or: any[] = [
      { email: regex },
      { firstName: regex },
      { lastName: regex },
    ];
    if (/^[0-9a-fA-F]{24}$/.test(q)) {
      or.push({ _id: q });
    }
    const MAX_LIMIT = 20;
    const users = await this.userRepository.find({ $or: or }).limit(MAX_LIMIT).select('_id firstName lastName email language').lean().exec();
    try {
      const ids = users.map((u: any) => u._id).filter(Boolean);
      if (ids.length > 0) {
        const profiles = await this.profileRepository.find({ owner: { $in: ids } }).select('owner profilePhotoUrl').lean().exec() as any[];
        const photoMap: Record<string, string> = {};
        for (const p of profiles) {
          if (p && p.owner) photoMap[p.owner.toString()] = (p as any).profilePhotoUrl || '';
        }
        return users.map((u: any) => {
          const { _id, firstName, lastName, email, language } = u;
          return { _id, firstName, lastName, email, language, profilePhotoUrl: photoMap[u._id?.toString()] || undefined };
        });
      }
    } catch (err) {
      return users.map((u: any) => {
        const { _id, firstName, lastName, email, language } = u;
        return { _id, firstName, lastName, email, language };
      });
    }
    return users.map((u: any) => {
      const { _id, firstName, lastName, email, language } = u;
      return { _id, firstName, lastName, email, language };
    });
  }
}
