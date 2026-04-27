import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository, ProfileRepository } from './index';
import { HashService } from './hash.service';
import * as crypto from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile';
import { EmailService } from './email.service';

// Service to handle user-related operations such as registration, password management, and profile updates
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly hashService: HashService,
    private readonly emailService: EmailService
  ) {}



  // Retrieve a user by their email address from the database
  getUserByEmail(email: string) {
    return this.userRepository.findOne({ email });
  }

  getUserById(id: string) {
    return this.userRepository.findById(id);
  }


  //Register a new user, hash the password, and save to the database
  async register(createUserDto: CreateUserDto) {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException("Las contraseñas no coinciden");
    }

    const user = await this.getUserByEmail(createUserDto.email);
    if (user) {
      throw new BadRequestException("Este correo electrónico ya está registrado");
    }

    const createUser = {
      ...createUserDto,
      password: await this.hashService.hashPassword(createUserDto.password),
    };
    return this.userRepository.create(createUser);
  }


// Check if the user's email is verified by looking at the isValid field in the database
  async isEmailVerified(email: string): Promise<{ isVerified: boolean; message: string }> {
    const user = await this.getUserByEmail(email);
    if (!user) {
        throw new BadRequestException('El usuario con el correo proporcionado no existe.');
    }
    
    if (user.isValid) {
        return { isVerified: true, message: 'Correo verificado con éxito.' };
    } else {
        return { isVerified: false, message: 'El correo aún no está verificado.' };
    }
}


// Verify the user's email by setting the isValid field to true in the database
async verifyEmail(email: string, token: string): Promise<boolean> {
  const user = await this.getUserByEmail(email);
  
  if (!user) {
      throw new BadRequestException('Usuario no existe.');
  }
  
  if (user.isValid) {
      throw new BadRequestException('Correo ya verificado.');
  }

  if (!user.verifyEmailTokenHash || !user.verifyEmailExpires || user.verifyEmailExpires < new Date()) {
      throw new BadRequestException('El token es inválido o ha expirado.');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (user.verifyEmailTokenHash !== tokenHash) {
      throw new BadRequestException('El token es inválido o ha expirado.');
  }
  
  try {
      user.isValid = true;
      user.verifyEmailTokenHash = undefined;
      user.verifyEmailExpires = undefined;
      await user.save();
      return true;
  } catch {
      throw new BadRequestException('Error al verificar correo.');
  }
}



// Verify the user's email by setting the isValid field to true in the database
async sendVerificationEmail(email: string): Promise<boolean> {
  const user = await this.getUserByEmail(email);
  
  if (!user) {
      throw new BadRequestException('Usuario no existe.');
  }

  if (user.isValid) {
      throw new BadRequestException('Correo ya verificado. No se puede reenviar.');
  }
  
  try {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      user.verifyEmailTokenHash = tokenHash;
      user.verifyEmailExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await user.save();

      await this.emailService.sendVerificationEmail(user.email, token);
      return true;
  } catch {
      throw new BadRequestException('Error al enviar correo.');
  }
}


// Update the user's token status (enable or disable) in the database
  async updateTokenStatus(email: string, isTokenEnabled: boolean) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    user.isTokenEnabled = isTokenEnabled;
    await user.save();
    return { msg: 'Seguridad de la cuenta actualizada con éxito.' };
  }


// Get the user's token status (enabled or disabled) from the database
  async getTokenStatus(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    return { isTokenEnabled: !!user.isTokenEnabled };
  }


// Change the user's password by verifying the current password and updating it with the new password in the database
  async changePassword(email: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordValid = await this.hashService.comparePassword(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // Prevent changing to the same password
    const isSameAsCurrent = await this.hashService.comparePassword(changePasswordDto.newPassword, user.password);
    if (isSameAsCurrent) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la anterior');
    }

    // Prevent password changes more than once within a 10-minute window
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    if (user.lastPasswordChange) {
      const elapsed = Date.now() - user.lastPasswordChange;
      if (elapsed < TEN_MINUTES_MS) {
        const remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / (60 * 1000));
        throw new BadRequestException(`No puedes cambiar la contraseña hasta pasados ${remainingMinutes} minuto(s) desde la última modificación.`);
      }
    }

    if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword) {
      throw new BadRequestException('Las nuevas contraseñas no coinciden');
    }

    user.password = await this.hashService.hashPassword(changePasswordDto.newPassword);
    user.lastPasswordChange = Date.now();
    await user.save();
    return { message: 'Contraseña actualizada con éxito' };
  }


// Update the user's profile information (first name, last name, and email) in the database
  async updateProfile(email: string, updateProfileDto: UpdateProfileDto, req?: any) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Prevent profile updates more than once within a 10-minute window
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    if (user.lastProfileUpdate) {
      const elapsed = Date.now() - user.lastProfileUpdate;
      if (elapsed < TEN_MINUTES_MS) {
        const remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / (60 * 1000));
        throw new BadRequestException(`No puedes actualizar tu perfil hasta pasados ${remainingMinutes} minuto(s) desde la última modificación.`);
      }
    }

    const providedFirstName = updateProfileDto.firstName !== undefined && updateProfileDto.firstName !== null;
    const providedLastName = updateProfileDto.lastName !== undefined && updateProfileDto.lastName !== null;
    const providedEmail = updateProfileDto.email !== undefined && updateProfileDto.email !== null;

    const firstNameChanged = providedFirstName && updateProfileDto.firstName !== user.firstName;
    const lastNameChanged = providedLastName && updateProfileDto.lastName !== user.lastName;
    const emailChanged = providedEmail && updateProfileDto.email !== user.email;

    // If none of the provided fields actually change the stored values, reject the update
    if (!firstNameChanged && !lastNameChanged && !emailChanged) {
      if ((providedFirstName || providedLastName) && !providedEmail) {
        throw new BadRequestException('Debes usar nombres diferentes al anterior');
      } else if (providedEmail && !providedFirstName && !providedLastName) {
        throw new BadRequestException('Debes usar un correo diferente al anterior');
      } else {
        throw new BadRequestException('Debes proporcionar valores diferentes a los actuales');
      }
    }

    // If email is being changed, ensure it's not already used by another user
    if (providedEmail && emailChanged) {
      const existingUser = await this.userRepository.findOne({ email: updateProfileDto.email });
      if (existingUser && existingUser.email !== email) {
        throw new BadRequestException('El correo electrónico ya está en uso');
      }
      user.email = updateProfileDto.email!;
      user.isValid = false; // Revocar estado de verificación
    }

    if (firstNameChanged) user.firstName = updateProfileDto.firstName!;
    if (lastNameChanged) user.lastName = updateProfileDto.lastName!;

    // update lastProfileUpdate timestamp
    user.lastProfileUpdate = Date.now();
    await user.save();

    const result = { message: 'Perfil actualizado con éxito' };

    if (req) {
      const updatedUser = await this.getUserByEmail(updateProfileDto.email || email);
      if (!updatedUser) {
        throw new BadRequestException('Error al actualizar sesión del usuario.');
      }

      return new Promise((resolve, reject) => {
        req.login(updatedUser, (err) => {
          if (err) {
            reject(new BadRequestException('Error al actualizar sesión del usuario.'));
          } else {
            resolve(result);
          }
        });
      });
    }

    return result;
  }

  // Sanitize search query to prevent ReDoS attacks
  private sanitizeSearchQuery(q: string): string {
    if (!q || typeof q !== 'string') return '';
    // Limit input length to 50 characters
    const truncated = q.substring(0, 50);
    // Escape regex special characters
    return truncated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Search users by query -- supports partial name/email and exact ObjectId
  async searchUsers(q: string) {
    if (!q) return [];
    
    // Sanitize input to prevent ReDoS attacks - escape regex special characters
    const sanitized = this.sanitizeSearchQuery(q);
    if (!sanitized) return [];
    
    const regex = new RegExp(sanitized, 'i');
    const or: any[] = [
      { email: regex },
      { firstName: regex },
      { lastName: regex },
    ];

    // If q looks like a Mongo ObjectId, include exact _id match
    if (/^[0-9a-fA-F]{24}$/.test(q)) {
      or.push({ _id: q });
    }

    // Enforce maximum limit of 20 results to prevent abuse
    const MAX_LIMIT = 20;
    const users = await this.userRepository.find({ $or: or }).limit(MAX_LIMIT).select('-password').lean().exec();

    // Fetch profile photos for the matching users and merge into results so frontend can render avatars
    try {
      const ids = users.map((u: any) => u._id).filter(Boolean);
      if (ids.length > 0) {
        const profiles = await this.profileRepository.find({ owner: { $in: ids } }).select('owner profilePhotoUrl').lean().exec();
        const photoMap: Record<string, string> = {};
        for (const p of profiles) {
          if (p && p.owner) photoMap[p.owner.toString()] = (p as any).profilePhotoUrl || '';
        }
        return users.map((u: any) => ({ ...u, profilePhotoUrl: photoMap[u._id?.toString()] || undefined }));
      }
    } catch (err) {
      // if profile lookup fails, just return users without photos
      return users;
    }

    return users;
  }
}
