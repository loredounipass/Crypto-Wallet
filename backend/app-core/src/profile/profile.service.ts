import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProfileRepository } from 'src/repositories/profile.repository';
import { UserService } from 'src/user/user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import { FeedPost, FeedPostDocument } from '../feed-and-multimedia/schemas/feed.schema';
import { Provider, ProviderDocument } from '../providers/schemas/provider.schema';
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

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_WALL_POSTS = 50;
const MAX_CURRENCIES = 10;

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly storage: LocalStorageProvider,
    private readonly userService: UserService,
    @InjectModel(FeedPost.name) private readonly feedModel: Model<FeedPostDocument>,
    @InjectModel(Provider.name) private readonly providerModel: Model<ProviderDocument>,
  ) {}


  // VALIDA EL IDENTIFICADOR Y LO CONVIERTE A OBJECTID DE MONGOOSE
  private toObjectId(userId: string): Types.ObjectId {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    return new Types.ObjectId(userId);
  }


  // NORMALIZA LA LISTA DE MONEDAS: MAYUSCULAS, SIN DUPLICADOS Y SOLO SIMBOLOS VALIDOS
  private sanitizeCurrencies(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    const out: string[] = [];
    for (const raw of input) {
      if (typeof raw !== 'string') continue;
      const sym = raw.trim().toUpperCase();
      if (/^[A-Z0-9]{2,10}$/.test(sym) && !out.includes(sym)) out.push(sym);
      if (out.length >= MAX_CURRENCIES) break;
    }
    return out;
  }


  // MAPEA UN DOCUMENTO DE POST AL FORMATO PUBLICO DEL MURO (CON FALLBACK DE 1 FOTO)
  private mapWallPost(doc: any) {
    const legacyUrls = doc.multimediaUrl ? [doc.multimediaUrl] : [];
    const legacyThumbs = doc.thumbnailUrl ? [doc.thumbnailUrl] : [];
    const legacyIds = doc.multimediaId ? [doc.multimediaId] : [];
    return {
      _id: doc._id?.toString(),
      description: doc.description,
      type: doc.type,
      author: doc.author?.toString(),
      authorFirstName: doc.authorFirstName || undefined,
      authorLastName: doc.authorLastName || undefined,
      multimediaId: doc.multimediaId,
      multimediaIds: Array.isArray(doc.multimediaIds) && doc.multimediaIds.length > 0 ? doc.multimediaIds : legacyIds,
      multimediaUrl: doc.multimediaUrl || undefined,
      multimediaUrls: Array.isArray(doc.multimediaUrls) && doc.multimediaUrls.length > 0 ? doc.multimediaUrls : legacyUrls,
      thumbnailUrl: doc.thumbnailUrl || undefined,
      thumbnailUrls: Array.isArray(doc.thumbnailUrls) && doc.thumbnailUrls.length > 0 ? doc.thumbnailUrls : legacyThumbs,
      likesCount: typeof doc.likesCount === 'number' ? doc.likesCount : 0,
      commentsCount: typeof doc.commentsCount === 'number' ? doc.commentsCount : 0,
      shares: doc.shares || 0,
      views: doc.views || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }


  // BUSCA EN LA BASE DE DATOS EL DOCUMENTO DEL PERFIL COMPLETO PERTENECIENTE A UN USUARIO ESPECIFICO
  async getByOwner(userId: string) {
    const owner = this.toObjectId(userId);
    return this.profileRepository.findOne({ owner });
  }


  // CONSTRUYE LA VISTA PUBLICA DEL PERFIL DEL FORO: IDENTIDAD, BIO, PAIS, MONEDAS, FLAG P2P Y MURO
  async getForumProfile(userId: string, limit = 20, viewerId?: string) {
    const owner = this.toObjectId(userId);
    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), MAX_WALL_POSTS);
    const [doc, user] = await Promise.all([
      this.profileRepository.findOne({ owner }),
      this.userService.getUserById(userId).catch(() => null),
    ]);
    if (!doc && !user) throw new NotFoundException('Profile not found');
    const email: string | undefined = user?.email;
    const [isProvider, posts, postsCount] = await Promise.all([
      email
        ? this.providerModel.exists({ email: { $in: [email, String(email).toLowerCase()] } }).then((r) => !!r)
        : Promise.resolve(false),
      this.feedModel
        .find({ author: owner })
        .select('_id description type author authorFirstName authorLastName multimediaId multimediaIds multimediaUrl multimediaUrls thumbnailUrl thumbnailUrls multimediaStatus likesCount commentsCount shares views createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean()
        .exec(),
      this.feedModel.countDocuments({ author: owner }).exec(),
    ]);
    const followers = Array.isArray((doc as any)?.followers) ? (doc as any).followers : [];
    const following = Array.isArray((doc as any)?.following) ? (doc as any).following : [];
    const viewerObj = viewerId && Types.ObjectId.isValid(viewerId) ? new Types.ObjectId(viewerId) : null;
    return {
      owner: owner.toString(),
      firstName: (doc as any)?.firstName || user?.firstName || undefined,
      lastName: (doc as any)?.lastName || user?.lastName || undefined,
      profilePhotoUrl: (doc as any)?.profilePhotoUrl || (user as any)?.profilePhotoUrl || undefined,
      coverPhotoUrl: (doc as any)?.coverPhotoUrl || undefined,
      bio: (doc as any)?.bio || undefined,
      country: (doc as any)?.country || undefined,
      currencies: Array.isArray((doc as any)?.currencies) ? (doc as any).currencies : [],
      p2pRegistered: isProvider,
      followersCount: followers.length,
      followingCount: following.length,
      isFollowing: viewerObj ? followers.some((id: any) => String(id) === String(viewerObj)) : false,
      postsCount,
      posts: posts.map((p: any) => this.mapWallPost(p)),
    };
  }


  // CONSTRUYE UNA VISTA PUBLICA DEL PERFIL FILTRANDO DATOS SENSIBLES Y USANDO EL USUARIO BASE COMO RESPALDO
  async getPublicById(userId: string) {
    const owner = this.toObjectId(userId);
    const doc: any = await this.profileRepository.findOne({ owner });
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
        coverPhotoUrl: doc.coverPhotoUrl || undefined,
        bio: doc.bio || undefined,
        country: doc.country || undefined,
        currencies: Array.isArray(doc.currencies) ? doc.currencies : [],
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


  // DEVUELVE TODAS LAS PUBLICACIONES DE UN AUTOR ORDENADAS POR FECHA (MOVIDO DESDE FEED-POSTS)
  async getPostsByAuthor(authorId: string, limit = 50) {
    const author = this.toObjectId(authorId);
    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), MAX_WALL_POSTS);
    const posts = await this.feedModel
      .find({ author })
      .select('_id description type author authorFirstName authorLastName multimediaId multimediaIds multimediaUrl multimediaUrls thumbnailUrl thumbnailUrls multimediaStatus likesCount commentsCount shares views createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean()
      .exec();
    return posts.map((doc: any) => this.mapWallPost(doc));
  }


  // ACTUALIZA LOS DATOS DEL PERFIL O CREA UN NUEVO REGISTRO EN CASO DE NO EXISTIR PREVIAMENTE
  async upsert(userId: string, dto: UpdateProfileDto) {
    const owner = this.toObjectId(userId);
    const data: any = {};
    if (dto.firstName !== undefined) data.firstName = String(dto.firstName).trim().slice(0, 60);
    if (dto.lastName !== undefined) data.lastName = String(dto.lastName).trim().slice(0, 60);
    if (dto.bio !== undefined) data.bio = String(dto.bio).trim().slice(0, 300);
    if (dto.country !== undefined) data.country = String(dto.country).trim().toUpperCase();
    if (dto.currencies !== undefined) data.currencies = this.sanitizeCurrencies(dto.currencies);
    return this.profileRepository.findOneAndUpdate({ owner }, { $set: data }, { upsert: true, returnDocument: 'after' });
  }


  // REGISTRA AL VISITANTE COMO SEGUIDOR DEL PERFIL Y LA RELACION INVERSA (IDEMPOTENTE)
  async follow(viewerId: string, targetId: string) {
    const viewer = this.toObjectId(viewerId);
    const target = this.toObjectId(targetId);
    if (viewer.equals(target)) throw new BadRequestException('Cannot follow yourself');
    const targetUser = await this.userService.getUserById(targetId).catch(() => null);
    if (!targetUser) throw new NotFoundException('User not found');
    await Promise.all([
      this.profileRepository.findOneAndUpdate(
        { owner: target },
        { $addToSet: { followers: viewer } },
        { upsert: true },
      ),
      this.profileRepository.findOneAndUpdate(
        { owner: viewer },
        { $addToSet: { following: target } },
        { upsert: true },
      ),
    ]);
    return this.getFollowState(viewerId, targetId);
  }


  // ELIMINA AL VISITANTE DE LOS SEGUIDORES DEL PERFIL Y LA RELACION INVERSA (IDEMPOTENTE)
  async unfollow(viewerId: string, targetId: string) {
    const viewer = this.toObjectId(viewerId);
    const target = this.toObjectId(targetId);
    if (viewer.equals(target)) throw new BadRequestException('Cannot unfollow yourself');
    await Promise.all([
      this.profileRepository.findOneAndUpdate(
        { owner: target },
        { $pull: { followers: viewer } },
      ),
      this.profileRepository.findOneAndUpdate(
        { owner: viewer },
        { $pull: { following: target } },
      ),
    ]);
    return this.getFollowState(viewerId, targetId);
  }


  // DEVUELVE EL ESTADO DE SEGUIMIENTO Y LOS CONTEOS DE SEGUIDORES/SEGUIDOS
  async getFollowState(viewerId: string, targetId: string) {
    const viewer = this.toObjectId(viewerId);
    const target = this.toObjectId(targetId);
    const doc: any = await this.profileRepository.findOne({ owner: target });
    const followers = Array.isArray(doc?.followers) ? doc.followers : [];
    const following = Array.isArray(doc?.following) ? doc.following : [];
    return {
      isFollowing: followers.some((id: any) => String(id) === String(viewer)),
      followersCount: followers.length,
      followingCount: following.length,
    };
  }


  // VALIDA EL ARCHIVO DE IMAGEN: TIPO MIME, EXTENSION Y TAMAÑO MAXIMO DE 10MB
  private validateImageFile(file: MulterFile) {
    if (!file?.buffer || file.buffer.length === 0) throw new BadRequestException('File missing');
    if (file.buffer.length > 10 * 1024 * 1024) throw new BadRequestException('File too large (max 10MB)');
    const mime = String(file.mimetype || '').toLowerCase();
    if (!IMAGE_MIME_TYPES.includes(mime)) throw new BadRequestException('Only images allowed (JPEG, PNG, GIF, WebP)');
    const ext = file.originalname ? path.extname(file.originalname).toLowerCase() : '';
    return IMAGE_EXTS.includes(ext) ? ext : (mime === 'image/png' ? '.png' : '.jpg');
  }


  // PROCESA OPTIMIZA Y GUARDA LA IMAGEN DE PERFIL O PORTADA GENERANDO TAMBIEN SU MINIATURA
  async uploadImage(userId: string, file: MulterFile, type: 'profile' | 'cover') {
    const owner = this.toObjectId(userId);
    const safeExt = this.validateImageFile(file);
    const isGif = String(file.mimetype).toLowerCase() === 'image/gif';
    const sharpOpts = { limitInputPixels: 25_000_000 };
    let mainBuf: Buffer;
    let mainMime = file.mimetype;
    if (isGif) {
      mainBuf = file.buffer;
    } else if (type === 'profile') {
      mainBuf = await sharp(file.buffer, sharpOpts).rotate().resize({ width: 512, height: 512, fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
      mainMime = 'image/jpeg';
    } else {
      mainBuf = await sharp(file.buffer, sharpOpts).rotate().resize({ width: 1600, height: 900, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
      mainMime = 'image/jpeg';
    }
    const thumbBuf = await sharp(file.buffer, sharpOpts).rotate().resize({ width: 400 }).jpeg({ quality: 80 }).toBuffer();
    const baseKey = `${type}/${crypto.randomUUID()}${isGif ? safeExt : '.jpg'}`;
    const [uploadRes, thumbRes] = await Promise.all([
      this.storage.upload(mainBuf, `final/${baseKey}`, mainMime),
      this.storage.upload(thumbBuf, `thumbs/${crypto.randomUUID()}.jpg`, 'image/jpeg'),
    ]);
    const update: any = {};
    if (type === 'profile') update.profilePhotoUrl = uploadRes.url;
    else update.coverPhotoUrl = uploadRes.url;
    const profile = await this.profileRepository.findOneAndUpdate({ owner }, { $set: update }, { upsert: true, returnDocument: 'after' });
    return { profile, url: uploadRes.url, thumbnailUrl: thumbRes.url };
  }
}

export default {};
