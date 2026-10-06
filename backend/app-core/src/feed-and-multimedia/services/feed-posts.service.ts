import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreatePostDto } from '../dto/create-post.dto';
import { FeedRepository } from '../feed.repository';
import { MultimediaRepository } from '../../messages-and-multimedia/messages-and-multimedia.module';
import { UserService } from 'src/user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { LocalStorageProvider } from 'src/storage/local.storage.provider';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from '../../profile/schemas/profile.schema';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class FeedPostsService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly multimediaRepository: MultimediaRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('multimedia') private readonly multimediaQueue: Queue,
    private readonly storage: LocalStorageProvider,
    @InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>,
  ) { }

  // ESCUCHA CUANDO EL PROCESADOR MULTIMEDIA TERMINA DE OPTIMIZAR UNA IMAGEN Y ACTUALIZA EL POST DEL FEED CON LA URL FINAL.
  // RECOMPUTA LOS ARREGLOS DESDE LOS DOCUMENTOS MULTIMEDIA (IDEMPOTENTE: NO IMPORTA EL ORDEN DE LOS EVENTOS).
  onModuleInit() {
    this.eventEmitter.on('multimedia.ready', async (payload: any) => {
      try {
        if (!payload?.messageId) return;
        const postId = payload.messageId;
        const post: any = await this.feedModel.findById(postId).lean().exec();
        if (!post) return;
        const rawIds: any[] = [
          ...(post.multimediaId ? [post.multimediaId] : []),
          ...(Array.isArray(post.multimediaIds) ? post.multimediaIds : []),
        ];
        const ids = [...new Set(rawIds.map((id) => String(id)))];
        const mdocs: any[] = ids.length > 0
          ? await this.multimediaModel.find({ _id: { $in: ids } }).select('_id url thumbnailUrl status').lean().exec()
          : [];
        const byId = new Map(mdocs.map((m: any) => [String(m._id), m]));
        const urls: string[] = [];
        const thumbs: string[] = [];
        for (const id of ids) {
          const m = byId.get(id);
          if (m?.url) urls.push(m.url);
          if (m?.thumbnailUrl) thumbs.push(m.thumbnailUrl);
        }
        const set: any = {
          multimediaUrls: [...new Set(urls)],
          thumbnailUrls: [...new Set(thumbs)],
        };
        const first = ids.length > 0 ? byId.get(ids[0]) : undefined;
        if (first && first.status === 'ready' && first.url) {
          set.multimediaUrl = first.url;
          if (first.thumbnailUrl) set.thumbnailUrl = first.thumbnailUrl;
          set.multimediaStatus = 'ready';
        }
        await this.feedModel.updateOne({ _id: postId }, { $set: set }).exec();
        const updated = await this.getPostById(postId);
        if (updated) {
          void this.eventEmitter.emit('post.updated', updated);
        }
      } catch (err) {
        console.error('[FeedPostsService] Error handling multimedia.ready for feed post:', err);
      }
    });
  }

  private get feedModel() {
    return this.feedRepository.feed;
  }

  private get multimediaModel() {
    return this.multimediaRepository.model;
  }

  private get commentModel() {
    return this.feedRepository.comment;
  }



  // MAPEA UN DOCUMENTO DE POST AL FORMATO DE API (CON FALLBACK PARA POSTS DE UNA SOLA FOTO)
  private toApiPost(doc: any) {
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
      authorPhotoUrl: (doc as any).authorPhotoUrl || undefined,
      multimediaId: doc.multimediaId,
      multimediaIds: Array.isArray(doc.multimediaIds) && doc.multimediaIds.length > 0 ? doc.multimediaIds : legacyIds,
      multimediaUrl: doc.multimediaUrl || undefined,
      multimediaUrls: Array.isArray(doc.multimediaUrls) && doc.multimediaUrls.length > 0 ? doc.multimediaUrls : legacyUrls,
      thumbnailUrl: doc.thumbnailUrl || undefined,
      thumbnailUrls: Array.isArray(doc.thumbnailUrls) && doc.thumbnailUrls.length > 0 ? doc.thumbnailUrls : legacyThumbs,
      multimediaStatus: doc.multimediaStatus || undefined,
      likes: Array.isArray(doc.likes) ? doc.likes.map((id: any) => id?.toString()) : [],
      likesCount: typeof doc.likesCount === 'number' ? doc.likesCount : (Array.isArray(doc.likes) ? doc.likes.length : 0),
      commentsCount: typeof doc.commentsCount === 'number' ? doc.commentsCount : 0,
      shares: doc.shares || 0,
      views: doc.views || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }


  // ADJUNTA LA FOTO DE PERFIL DE CADA AUTOR EN LOTE (1 QUERY PARA TODA LA PAGINA)
  private async enrichAuthorPhotos(docs: any[]) {
    try {
      const ids = [...new Set(
        docs.map((d: any) => d?.author?.toString()).filter((id: string) => id && Types.ObjectId.isValid(id)),
      )].map((id: string) => new Types.ObjectId(id));
      if (ids.length === 0) return docs;
      const profiles = await this.profileModel.find({ owner: { $in: ids } }).select('owner profilePhotoUrl').lean().exec();
      const photoByOwner = new Map((profiles || []).map((p: any) => [String(p.owner), p.profilePhotoUrl]));
      for (const d of docs) {
        const url = photoByOwner.get(String(d?.author));
        if (url) d.authorPhotoUrl = url;
      }
    } catch (_) { /* FOTO OPCIONAL: JAMAS ROMPE EL FEED */ }
    return docs;
  }


  // OBTIENE LOS DETALLES COMPLETOS DE UNA PUBLICACION INCLUYENDO SUS ESTADISTICAS Y CONTENIDO MULTIMEDIA
  async getPostById(postId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).lean().exec();
    if (!post) throw new NotFoundException('Post not found');
    await this.enrichAuthorPhotos([post]);
    return this.toApiPost(post);
  }



  // VERIFICA AL AUTOR Y CREA UN NUEVO REGISTRO EN LA BASE DE DATOS PARA UNA PUBLICACION DE TEXTO SIMPLE
  async createPost(dto: CreatePostDto, authorId: string) {
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid authorId');
    const actor = await this.userService.getUserById(authorId);
    if (!actor) throw new NotFoundException('Author not found');
    const description = typeof dto.description === 'string' ? dto.description.trim() : '';
    const type = (dto as any).type || 'text';
    if (type === 'text' && !description) throw new BadRequestException('Description is required for text posts');
    const postPayload: any = {
      description,
      type,
      author: new Types.ObjectId(authorId),
      authorFirstName: actor.firstName || undefined,
      authorLastName: actor.lastName || undefined,
      likesCount: 0,
      commentsCount: 0,
    };
    if (dto.multimediaId && Types.ObjectId.isValid(dto.multimediaId)) {
      try {
        const m = await this.multimediaModel.findById(dto.multimediaId).select('_id url thumbnailUrl status').lean().exec();
        if (m) {
          postPayload.multimediaId = m._id;
          postPayload.multimediaUrl = m.url || undefined;
          postPayload.thumbnailUrl = m.thumbnailUrl || undefined;
          postPayload.multimediaStatus = m.status || undefined;
        } else {
          postPayload.multimediaId = undefined;
        }
      } catch (_) {
        postPayload.multimediaId = undefined;
      }
    }
    const created = await this.feedModel.create(postPayload);
    const out = await this.getPostById(created._id?.toString());
    void this.eventEmitter.emit('post.created', out);
    return out;
  }



  // CARGA UN ARCHIVO AL ALMACENAMIENTO TEMPORAL CREA EL REGISTRO MULTIMEDIA Y LA PUBLICACION DE FORMA TRANSACCIONAL
  async createPostWithFile(file: any, body: any, authorId: string) {
    if (!file) throw new BadRequestException('File is required');
    return this.createPostWithFiles([file], body, authorId);
  }


  // CARGA HASTA 10 IMAGENES CREA SUS REGISTROS MULTIMEDIA Y UNA SOLA PUBLICACION TIPO CARRUSEL
  async createPostWithFiles(files: any[], body: any, authorId: string) {
    if (!files || files.length === 0) throw new BadRequestException('File is required');
    if (files.length > 10) throw new BadRequestException('Máximo 10 imágenes por publicación');
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid authorId');

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    for (const f of files) {
      if (!f?.mimetype || !allowedMimeTypes.includes(String(f.mimetype).toLowerCase())) {
        throw new BadRequestException('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
      }
    }

    const dto: CreatePostDto = {
      description: typeof body?.description === 'string' ? body.description.trim() : '',
      type: 'image' as any,
      authorId: authorId,
    } as CreatePostDto;
    const ext = (f: any) => {
      const e = f.originalname ? path.extname(f.originalname).toLowerCase() : '';
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return allowedExts.includes(e) ? e : '.bin';
    };
    const staged: Array<{ file: any; stagingKey: string; uploadResult: any }> = [];
    for (const f of files) {
      const stagingKey = `staging/${crypto.randomUUID()}${ext(f)}`;
      const uploadResult = await this.storage.upload(f.buffer, stagingKey, f.mimetype);
      staged.push({ file: f, stagingKey, uploadResult });
    }
    const actor = await this.userService.getUserById(authorId);
    if (!actor) {
      for (const s of staged) { try { await this.storage.delete(s.uploadResult.key) } catch (_) { } }
      throw new NotFoundException('Author not found');
    }
    const session = await this.feedModel.db.startSession();
    let createdPostId: string | undefined = undefined;
    let multimediaIdsCreated: any[] = [];
    let createdMultimediaDocs: any[] = [];
    let createdPostDoc: any = undefined;
    let usedTransaction = false;
    try {
      try {
        await session.withTransaction(async () => {
          const multimediaDocs = await this.multimediaModel.create(
            staged.map((s) => ({
              url: s.uploadResult.url,
              type: dto.type,
              owner: new Types.ObjectId(authorId),
              description: dto.description || undefined,
              mimeType: s.uploadResult.mimeType,
              size: s.uploadResult.size,
              status: 'processing',
              processingJob: {
                stagingKey: s.stagingKey,
                ownerId: authorId,
                mimeType: s.file.mimetype,
                enqueued: false,
              },
            })),
            { session, ordered: true });
          const mDocs = Array.isArray(multimediaDocs) ? multimediaDocs : [multimediaDocs];
          multimediaIdsCreated = mDocs.map((m: any) => m._id);
          const created = await this.feedModel.create([
            {
              description: dto.description,
              type: dto.type,
              author: new Types.ObjectId(authorId),
              authorFirstName: actor.firstName || undefined,
              authorLastName: actor.lastName || undefined,
              multimediaId: mDocs[0]._id,
              multimediaIds: mDocs.map((m: any) => m._id),
              multimediaUrl: staged[0].uploadResult.url,
              multimediaUrls: staged.map((s) => s.uploadResult.url),
              thumbnailUrl: (mDocs[0] as any).thumbnailUrl || undefined,
              thumbnailUrls: [],
              multimediaStatus: (mDocs[0] as any).status || 'processing',
              likesCount: 0,
              commentsCount: 0,
            },
          ], { session, ordered: true });
          const p = Array.isArray(created) ? created[0] : created;
          for (let i = 0; i < mDocs.length; i++) {
            const mDoc = mDocs[i];
            const s = staged[i];
            if ((this as any).multimediaRepository?.updateOne) {
              await (this as any).multimediaRepository.updateOne({ _id: mDoc._id }, { $set: { message: p._id, status: 'processing', url: s.uploadResult.url } }, { session }).exec();
            } else {
              await (this as any).multimediaModel.updateOne({ _id: mDoc._id }, { $set: { message: p._id, status: 'processing', url: s.uploadResult.url } }, { session }).exec();
            }
          }
          createdPostId = p._id?.toString();
          createdMultimediaDocs = mDocs;
          createdPostDoc = p;
        });
        usedTransaction = true;
      } catch (txErr) {
        const txErrAny = txErr as any;
        const msg = String(txErrAny?.message || '').toLowerCase();
        const nestedMsg = String(txErrAny?.originalError?.message || txErrAny?.errorResponse?.errmsg || '').toLowerCase();
        const isTransactionError = msg.includes('transaction numbers are only allowed')
          || msg.includes('transactions are not supported')
          || msg.includes('retryable writes')
          || nestedMsg.includes('transaction numbers are only allowed')
          || nestedMsg.includes('transactions are not supported');
        if (!isTransactionError) {
          throw txErr;
        }
      }
      if (!usedTransaction) {
        try {
          createdMultimediaDocs = [];
          for (const s of staged) {
            const mDoc: any = await this.multimediaModel.create({
              url: s.uploadResult.url,
              type: dto.type,
              owner: new Types.ObjectId(authorId),
              description: dto.description || undefined,
              mimeType: s.uploadResult.mimeType,
              size: s.uploadResult.size,
              status: 'processing',
              processingJob: {
                stagingKey: s.stagingKey,
                ownerId: authorId,
                mimeType: s.file.mimetype,
                enqueued: false,
              },
            });
            createdMultimediaDocs.push(mDoc);
          }
          multimediaIdsCreated = createdMultimediaDocs.map((m: any) => m._id);
          createdPostDoc = await this.feedModel.create({
            description: dto.description,
            type: dto.type,
            author: new Types.ObjectId(authorId),
            authorFirstName: actor.firstName || undefined,
            authorLastName: actor.lastName || undefined,
            multimediaId: createdMultimediaDocs[0]._id,
            multimediaIds: multimediaIdsCreated,
            multimediaUrl: staged[0].uploadResult.url,
            multimediaUrls: staged.map((s) => s.uploadResult.url),
            thumbnailUrl: createdMultimediaDocs[0].thumbnailUrl || undefined,
            thumbnailUrls: [],
            multimediaStatus: createdMultimediaDocs[0].status || 'processing',
            likesCount: 0,
            commentsCount: 0,
          });
          for (let i = 0; i < createdMultimediaDocs.length; i++) {
            await this.multimediaModel.updateOne({ _id: createdMultimediaDocs[i]._id }, { $set: { message: createdPostDoc._id, status: 'processing', url: staged[i].uploadResult.url } }).exec();
          }
          createdPostId = createdPostDoc._id?.toString();
        } catch (nonTxErr) {
          for (const m of createdMultimediaDocs) { try { if (m?._id) await this.multimediaModel.deleteOne({ _id: m._id }).exec(); } catch (_) { } }
          try { if (createdPostDoc && createdPostDoc._id) await this.feedModel.deleteOne({ _id: createdPostDoc._id }).exec(); } catch (_) { }
          for (const s of staged) { try { await this.storage.delete(s.uploadResult.key) } catch (_) { } }
          throw nonTxErr;
        }
      }
    } catch (err) {
      for (const s of staged) { try { await this.storage.delete(s.uploadResult.key) } catch (_) { } }
      throw err;
    } finally {
      try { session.endSession(); } catch (_) { }
    }
    if (!createdPostId) throw new Error('Failed to create post');
    try {
      for (let i = 0; i < staged.length; i++) {
        const s = staged[i];
        const enqueue = this.multimediaQueue.add('process', {
          stagingKey: s.uploadResult.key,
          multimediaId: multimediaIdsCreated[i]?.toString(),
          messageId: createdPostId,
          ownerId: authorId,
          mimeType: s.file.mimetype,
        });
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('queue timeout')), 5000));
        await Promise.race([enqueue, timeout]);
        try {
          await this.multimediaModel.updateOne({ _id: multimediaIdsCreated[i] }, { $set: { 'processingJob.enqueued': true } }).exec();
        } catch (_) { }
      }
    } catch (err) {
      console.warn('[FeedPostsService] multimedia queue enqueue failed (post creado igual):', (err as Error)?.message || err);
    }
    const out = await this.getPostById(createdPostId);
    void this.eventEmitter.emit('post.created', out);
    return out;
  }



  // EXTRAE LA LISTA DE PUBLICACIONES GLOBALES ORDENADAS POR FECHA PARA EL MURO PRINCIPAL DE LA PLATAFORMA CON PAGINACION CURSOR-BASED
  async getFeed(limit = 20, cursor?: string) {
    const query: any = {};
    if (cursor && Types.ObjectId.isValid(cursor)) {
      const cursorPost = await this.feedModel.findById(cursor).select('createdAt').lean().exec();
      if (cursorPost) {
        query.createdAt = { $lt: (cursorPost as any).createdAt };
      }
    }
    const posts = await this.feedModel
      .find(query)
      .select(`
        _id description type author
        authorFirstName authorLastName
        multimediaId multimediaIds multimediaUrl multimediaUrls thumbnailUrl thumbnailUrls multimediaStatus
        likes likesCount commentsCount
        shares views createdAt updatedAt
      `)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;
    await this.enrichAuthorPhotos(sliced);

    return {
      posts: sliced.map((doc: any) => this.toApiPost(doc)),
      nextCursor: hasMore ? sliced[sliced.length - 1]._id?.toString() : null,
      hasMore,
    };
  }



  // MODIFICA EL CONTENIDO DE UNA PUBLICACION EXISTENTE SIEMPRE QUE LA SOLICITUD PROVENGA DEL AUTOR ORIGINAL
  async updatePost(postId: string, data: Partial<CreatePostDto>, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author.toString() !== actorId) throw new ForbiddenException('Not allowed');
    const update: any = {};
    if (data.description !== undefined) update.description = data.description as any;
    if (data.type !== undefined) update.type = data.type as any;
    if ((data as any).multimediaId !== undefined) update.multimediaId = (data as any).multimediaId ? new Types.ObjectId((data as any).multimediaId) : undefined;
    if (Object.keys(update).length > 0) {
      await this.feedModel.findByIdAndUpdate(postId, { $set: update }).exec();
    }
    const out = await this.getPostById(postId);
    void this.eventEmitter.emit('post.updated', out);
    return out;
  }



  // BORRA DEFINITIVAMENTE UNA PUBLICACION INCLUYENDO SUS COMENTARIOS Y LIBERA EL ESPACIO DE ALMACENAMIENTO
  async deletePost(postId: string, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).lean().exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author?.toString() !== actorId) throw new ForbiddenException('Not allowed');

    const multimediaIds: any[] = Array.isArray((post as any).multimediaIds) && (post as any).multimediaIds.length > 0
      ? (post as any).multimediaIds
      : (post.multimediaId ? [post.multimediaId] : []);
    let multimediaDocs: any[] = [];
    if (multimediaIds.length > 0) {
      multimediaDocs = await this.multimediaModel.find({ _id: { $in: multimediaIds } }).lean().exec();
    }

    try {
      if (multimediaDocs.length > 0) {
        await this.multimediaModel.deleteMany({ _id: { $in: multimediaDocs.map((m: any) => m._id) } }).exec();
      }
      await this.commentModel.deleteMany({ post: new Types.ObjectId(postId) }).exec();
      await this.feedModel.findByIdAndDelete(postId).exec();
    } catch (err) {
      throw new Error(`Error deleting from database: ${err}`);
    }

    // Limpieza de archivos en disco
    try {
      for (const multimediaDoc of multimediaDocs) {
        const stagingKey = multimediaDoc?.processingJob?.stagingKey;
        if (stagingKey) await this.storage.delete(stagingKey);

        // Si ya se procesó, eliminar archivos finales extrayendo la key desde la URL
        const finalUrl = multimediaDoc?.url;
        if (finalUrl && typeof finalUrl === 'string') {
          const finalKey = finalUrl.split('/uploads/multimedia/')[1];
          if (finalKey) await this.storage.delete(finalKey);
        }
        const thumbUrl = multimediaDoc?.thumbnailUrl;
        if (thumbUrl && typeof thumbUrl === 'string') {
          const thumbKey = thumbUrl.split('/uploads/multimedia/')[1];
          if (thumbKey) await this.storage.delete(thumbKey);
        }
      }
    } catch (_) { }

    void this.eventEmitter.emit('post.deleted', { _id: postId, author: actorId });
    return { success: true };
  }

}
