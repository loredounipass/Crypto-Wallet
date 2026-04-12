import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProfileRepository } from 'src/repositories/profile.repository';
import { UserService } from 'src/user/user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import sharp from 'sharp';
import * as crypto from 'crypto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly storage: LocalStorageProvider,
    private readonly userService: UserService,
  ) {}

  async getByOwner(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const doc = await this.profileRepository.findOne({ owner: new Types.ObjectId(userId) });
    return doc;
  }

  // Public view for other users: expose only non-sensitive fields and counts
  async getPublicById(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const doc: any = await this.profileRepository.findOne({ owner: new Types.ObjectId(userId) });

    // Fetch user record to use as name/avatar fallback (in case profile doc has no firstName)
    let userFallback: any = null;
    try {
      userFallback = await this.userService.getUserById(userId);
    } catch (_) {}

    if (doc) {
      const publicView = {
        owner: doc.owner?.toString(),
        firstName: doc.firstName || userFallback?.firstName || undefined,
        lastName: doc.lastName || userFallback?.lastName || undefined,
        profilePhotoUrl: doc.profilePhotoUrl || userFallback?.profilePhotoUrl || undefined,
        createdAt: doc.createdAt,
      };
      return publicView;
    }

    // If no profile document exists, build a minimal public view from the User
    if (userFallback) {
      return {
        owner: userFallback._id?.toString(),
        firstName: userFallback.firstName || undefined,
        lastName: userFallback.lastName || undefined,
        profilePhotoUrl: userFallback.profilePhotoUrl || undefined,
        createdAt: userFallback.createdAt,
      };
    }

    throw new NotFoundException('Profile not found');
  }

  // Public: get photos/videos posted by a given user (for profile media tab)
  async getPostsForProfile(userId: string, limit = 50) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    return [];
  }

  // Update profile
  async upsert(userId: string, dto: UpdateProfileDto) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const data: any = { ...dto };
    const res = await this.profileRepository.findOneAndUpdate({ owner: new Types.ObjectId(userId) }, data, { upsert: true, new: true });
    return res;
  }

  // Uploads and processes profile image.
  async uploadImage(userId: string, file: Express.Multer.File, type: 'profile') {
    if (!file) throw new BadRequestException('File missing');
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');

    const baseKey = `${type}/${crypto.randomUUID()}-${file.originalname}`;

    // Optimize image and create thumbnail
    const tmpOptimized = await sharp(file.buffer).toBuffer();
    const thumbBuf = await sharp(file.buffer).resize({ width: 400 }).jpeg().toBuffer();

    // Upload optimized + thumbnail
    const uploadRes = await this.storage.upload(tmpOptimized, `final/${baseKey}`, file.mimetype);
    const thumbRes = await this.storage.upload(thumbBuf, `thumbs/${crypto.randomUUID()}-${file.originalname}`, 'image/jpeg');

    const publicUrl = uploadRes.url;

    const update: any = {};
    if (type === 'profile') update.profilePhotoUrl = publicUrl;

    const profile = await this.profileRepository.findOneAndUpdate({ owner: new Types.ObjectId(userId) }, { $set: update }, { upsert: true, new: true });

    return { profile, url: publicUrl, thumbnailUrl: thumbRes.url };
  }
}

export default {};
