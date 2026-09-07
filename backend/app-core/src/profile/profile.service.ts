import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProfileRepository } from 'src/repositories/profile.repository';
import { UserService } from 'src/user/user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import sharp from 'sharp';
import * as crypto from 'crypto';
import * as path from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly storage: LocalStorageProvider,
    private readonly userService: UserService,
  ) {}



  // BUSCA EN LA BASE DE DATOS EL DOCUMENTO DEL PERFIL COMPLETO PERTENECIENTE A UN USUARIO ESPECIFICO
  async getByOwner(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const doc = await this.profileRepository.findOne({ owner: new Types.ObjectId(userId) });
    return doc;
  }



  // CONSTRUYE UNA VISTA PUBLICA DEL PERFIL FILTRANDO DATOS SENSIBLES Y USANDO EL USUARIO BASE COMO RESPALDO
  async getPublicById(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const doc: any = await this.profileRepository.findOne({ owner: new Types.ObjectId(userId) });
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



  // DEVUELVE EL ARREGLO DE PUBLICACIONES MULTIMEDIA DEL PERFIL AUNQUE ACTUALMENTE RETORNA UNA LISTA VACIA
  getPostsForProfile(userId: string, limit = 50) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    return [];
  }



  // ACTUALIZA LOS DATOS DEL PERFIL O CREA UN NUEVO REGISTRO EN CASO DE NO EXISTIR PREVIAMENTE
  async upsert(userId: string, dto: UpdateProfileDto) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const data: any = { ...dto };
    const res = await this.profileRepository.findOneAndUpdate({ owner: new Types.ObjectId(userId) }, { $set: data }, { upsert: true, returnDocument: 'after' });
    return res;
  }



  // PROCESA OPTIMIZA Y GUARDA LA IMAGEN DE PERFIL EN EL ALMACENAMIENTO GENERANDO TAMBIEN UNA VERSION MINIATURA
  async uploadImage(userId: string, file: MulterFile, type: 'profile') {
    if (!file) throw new BadRequestException('File missing');
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const ext = file.originalname ? path.extname(file.originalname).toLowerCase() : '.jpg';
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const safeExt = allowedExts.includes(ext) ? ext : '.jpg';
    const baseKey = `${type}/${crypto.randomUUID()}${safeExt}`;
    const tmpOptimized = await sharp(file.buffer).toBuffer();
    const thumbBuf = await sharp(file.buffer).resize({ width: 400 }).jpeg().toBuffer();
    const uploadRes = await this.storage.upload(tmpOptimized, `final/${baseKey}`, file.mimetype);
    const thumbRes = await this.storage.upload(thumbBuf, `thumbs/${crypto.randomUUID()}${safeExt}`, 'image/jpeg');
    const publicUrl = uploadRes.url;
    const update: any = {};
    if (type === 'profile') update.profilePhotoUrl = publicUrl;
    const profile = await this.profileRepository.findOneAndUpdate({ owner: new Types.ObjectId(userId) }, { $set: update }, { upsert: true, returnDocument: 'after' });
    return { profile, url: publicUrl, thumbnailUrl: thumbRes.url };
  }
}

export default {};
