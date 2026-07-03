import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
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


// Check if the user's email is verified by looking at the isValid field in the database
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


// Verify the user's email by setting the isValid field to true in the database
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



// Verify the user's email by setting the isValid field to true in the database
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
      user.verifyEmailExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await user.save();

      await this.emailService.sendVerificationEmail(user.email, token);
      return true;
  } catch {
      throw new BadRequestException('Error sending email.');
  }
}


// Update the user's token status (enable or disable) in the database
  async updateTokenStatus(email: string, isTokenEnabled: boolean) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    user.isTokenEnabled = isTokenEnabled;
    await user.save();
    return { msg: 'Account security updated successfully.' };
  }


// Get the user's token status (enabled or disabled) from the database
  async getTokenStatus(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return { isTokenEnabled: !!user.isTokenEnabled };
  }

  async updateLanguage(email: string, language: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    user.language = language;
    await user.save();
    return { msg: 'Language updated successfully.' };
  }

  async getUserLanguage(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return { language: user.language || 'es' };
  }


// Change the user's password by verifying the current password and updating it with the new password in the database
  async changePassword(email: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.hashService.comparePassword(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Prevent changing to the same password
    const isSameAsCurrent = await this.hashService.comparePassword(changePasswordDto.newPassword, user.password);
    if (isSameAsCurrent) {
      throw new BadRequestException('The new password cannot be the same as the previous one');
    }

    // Prevent password changes more than once within a 10-minute window
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


// Update the user's profile information (first name, last name, and email) in the database
  async updateProfile(email: string, updateProfileDto: UpdateProfileDto, req?: any) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent profile updates more than once within a 10-minute window
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

    // If none of the provided fields actually change the stored values, reject the update
    if (!firstNameChanged && !lastNameChanged && !emailChanged) {
      if ((providedFirstName || providedLastName) && !providedEmail) {
        throw new BadRequestException('You must use different names than the previous one');
      } else if (providedEmail && !providedFirstName && !providedLastName) {
        throw new BadRequestException('You must use a different email than the previous one');
      } else {
        throw new BadRequestException('You must provide different values than the current ones');
      }
    }

    // If email is being changed, ensure it's not already used by another user
    if (providedEmail && emailChanged) {
      const existingUser = await this.userRepository.findOne({ email: updateProfileDto.email });
      if (existingUser && existingUser.email !== email) {
        throw new BadRequestException('The email is already in use');
      }
      user.email = updateProfileDto.email!;
      user.isValid = false; // Revoke verification status
    }

    if (firstNameChanged) user.firstName = updateProfileDto.firstName!;
    if (lastNameChanged) user.lastName = updateProfileDto.lastName!;

    // update lastProfileUpdate timestamp
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

   // Search users by query -- supports partial name/email and exact ObjectId
  async searchUsers(q: string) {
    if (!q) return [];
    
    // Sanitize input to prevent ReDoS attacks - escape regex special characters
    const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        const profiles = await this.profileRepository.find({ owner: { $in: ids } }).select('owner profilePhotoUrl').lean().exec() as any[];
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
