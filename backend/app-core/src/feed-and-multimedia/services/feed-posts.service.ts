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
  ) { }

  // ESCUCHA CUANDO EL PROCESADOR MULTIMEDIA TERMINA DE OPTIMIZAR UNA IMAGEN Y ACTUALIZA EL POST DEL FEED CON LA URL FINAL
  onModuleInit() {
    this.eventEmitter.on('multimedia.ready', async (payload: any) => {
      try {
        if (!payload?.messageId) return;
        const postId = payload.messageId;
        const update: any = { multimediaStatus: 'ready' };
        if (payload.url) update.multimediaUrl = payload.url;
        if (payload.thumbnailUrl) update.thumbnailUrl = payload.thumbnailUrl;
        const updated = await this.feedModel.findByIdAndUpdate(postId, { $set: update }, { new: true }).lean().exec();
        if (updated) {
          const out = await this.getPostById(postId);
          void this.eventEmitter.emit('post.updated', out);
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



  // OBTIENE LOS DETALLES COMPLETOS DE UNA PUBLICACION INCLUYENDO SUS ESTADISTICAS Y CONTENIDO MULTIMEDIA
  async getPostById(postId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).lean().exec();
    if (!post) throw new NotFoundException('Post not found');
    return {
      _id: post._id?.toString(),
      description: post.description,
      type: post.type,
      author: post.author?.toString(),
      authorFirstName: (post as any).authorFirstName || undefined,
      authorLastName: (post as any).authorLastName || undefined,
      multimediaId: post.multimediaId,
      multimediaUrl: (post as any).multimediaUrl || undefined,
      thumbnailUrl: (post as any).thumbnailUrl || undefined,
      likes: Array.isArray(post.likes) ? post.likes.map((id: any) => id?.toString()) : [],
      likesCount: typeof (post as any).likesCount === 'number' ? (post as any).likesCount : (Array.isArray(post.likes) ? post.likes.length : 0),
      commentsCount: typeof (post as any).commentsCount === 'number' ? (post as any).commentsCount : 0,
      shares: post.shares || 0,
      views: post.views || 0,
      createdAt: (post as any).createdAt,
      updatedAt: (post as any).updatedAt,
    };
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
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid authorId');

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
    }

    const dto: CreatePostDto = {
      description: typeof body?.description === 'string' ? body.description.trim() : '',
      type: 'image' as any,
      authorId: authorId,
    } as CreatePostDto;
    const ext = file.originalname ? path.extname(file.originalname).toLowerCase() : '';
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const safeExt = allowedExts.includes(ext) ? ext : '.bin';
    const stagingKey = `staging/${crypto.randomUUID()}${safeExt}`;
    const uploadResult = await this.storage.upload(file.buffer, stagingKey, file.mimetype);
    const actor = await this.userService.getUserById(authorId);
    if (!actor) {
      try { await this.storage.delete(uploadResult.key) } catch (_) { }
      throw new NotFoundException('Author not found');
    }
    const session = await this.feedModel.db.startSession();
    let createdPostId: string | undefined = undefined;
    let multimediaIdCreated: any = undefined;
    let createdMultimediaDoc: any = undefined;
    let createdPostDoc: any = undefined;
    let usedTransaction = false;
    try {
      try {
        await session.withTransaction(async () => {
          const multimediaDocs = await this.multimediaModel.create([
            {
              url: uploadResult.url,
              type: dto.type,
              owner: new Types.ObjectId(authorId),
              description: dto.description || undefined,
              mimeType: uploadResult.mimeType,
              size: uploadResult.size,
              status: 'processing',
              processingJob: {
                stagingKey,
                ownerId: authorId,
                mimeType: file.mimetype,
                enqueued: false,
              },
            },
          ], { session });
          const mDoc = Array.isArray(multimediaDocs) ? multimediaDocs[0] : multimediaDocs;
          multimediaIdCreated = mDoc._id;
          const created = await this.feedModel.create([
            {
              description: dto.description,
              type: dto.type,
              author: new Types.ObjectId(authorId),
              authorFirstName: actor.firstName || undefined,
              authorLastName: actor.lastName || undefined,
              multimediaId: mDoc._id,
              multimediaUrl: uploadResult.url,
              thumbnailUrl: mDoc.thumbnailUrl || undefined,
              multimediaStatus: mDoc.status || 'processing',
              likesCount: 0,
              commentsCount: 0,
            },
          ], { session });
          const p = Array.isArray(created) ? created[0] : created;
          if ((this as any).multimediaRepository?.updateOne) {
            await (this as any).multimediaRepository.updateOne({ _id: mDoc._id }, { $set: { message: p._id, status: 'processing', url: uploadResult.url } }, { session }).exec();
          } else {
            await (this as any).multimediaModel.updateOne({ _id: mDoc._id }, { $set: { message: p._id, status: 'processing', url: uploadResult.url } }, { session }).exec();
          }
          createdPostId = p._id?.toString();
          createdMultimediaDoc = mDoc;
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
          createdMultimediaDoc = await this.multimediaModel.create({
            url: uploadResult.url,
            type: dto.type,
            owner: new Types.ObjectId(authorId),
            description: dto.description || undefined,
            mimeType: uploadResult.mimeType,
            size: uploadResult.size,
            status: 'processing',
            processingJob: {
              stagingKey,
              ownerId: authorId,
              mimeType: file.mimetype,
              enqueued: false,
            },
          });
          multimediaIdCreated = createdMultimediaDoc._id;
          createdPostDoc = await this.feedModel.create({
            description: dto.description,
            type: dto.type,
            author: new Types.ObjectId(authorId),
            authorFirstName: actor.firstName || undefined,
            authorLastName: actor.lastName || undefined,
            multimediaId: createdMultimediaDoc._id,
            multimediaUrl: uploadResult.url,
            thumbnailUrl: createdMultimediaDoc.thumbnailUrl || undefined,
            multimediaStatus: createdMultimediaDoc.status || 'processing',
            likesCount: 0,
            commentsCount: 0,
          });
          await this.multimediaModel.updateOne({ _id: createdMultimediaDoc._id }, { $set: { message: createdPostDoc._id, status: 'processing', url: uploadResult.url } }).exec();
          createdPostId = createdPostDoc._id?.toString();
        } catch (nonTxErr) {
          try { if (createdMultimediaDoc && createdMultimediaDoc._id) await this.multimediaModel.deleteOne({ _id: createdMultimediaDoc._id }).exec(); } catch (_) { }
          try { if (createdPostDoc && createdPostDoc._id) await this.feedModel.deleteOne({ _id: createdPostDoc._id }).exec(); } catch (_) { }
          try { await this.storage.delete(uploadResult.key) } catch (_) { }
          throw nonTxErr;
        }
      }
    } catch (err) {
      try { await this.storage.delete(uploadResult.key) } catch (_) { }
      throw err;
    } finally {
      try { session.endSession(); } catch (_) { }
    }
    if (!createdPostId) throw new Error('Failed to create post');
    try {
      const enqueue = this.multimediaQueue.add('process', {
        stagingKey: uploadResult.key,
        multimediaId: multimediaIdCreated?.toString(),
        messageId: createdPostId,
        ownerId: authorId,
        mimeType: file.mimetype,
      });
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('queue timeout')), 5000));
      await Promise.race([enqueue, timeout]);
      try {
        await this.multimediaModel.updateOne({ _id: multimediaIdCreated }, { $set: { 'processingJob.enqueued': true } }).exec();
      } catch (_) { }
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
        multimediaId multimediaUrl thumbnailUrl multimediaStatus
        likes likesCount commentsCount
        shares views createdAt updatedAt
      `)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;

    return {
      posts: sliced.map((doc: any) => ({
        _id: doc._id,
        description: doc.description,
        type: doc.type,
        author: doc.author?.toString(),
        authorFirstName: doc.authorFirstName || undefined,
        authorLastName: doc.authorLastName || undefined,
        multimediaId: doc.multimediaId,
        multimediaUrl: doc.multimediaUrl || undefined,
        thumbnailUrl: doc.thumbnailUrl || undefined,
        likes: Array.isArray(doc.likes) ? doc.likes.map((id: any) => id?.toString()) : [],
        likesCount: typeof doc.likesCount === 'number' ? doc.likesCount : (Array.isArray(doc.likes) ? doc.likes.length : 0),
        commentsCount: typeof doc.commentsCount === 'number' ? doc.commentsCount : 0,
        shares: doc.shares || 0,
        views: doc.views || 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
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

    let multimediaDoc: any = undefined;
    if (post.multimediaId) {
      multimediaDoc = await this.multimediaModel.findById(post.multimediaId).lean().exec();
    }

    try {
      if (multimediaDoc) {
        await this.multimediaModel.deleteOne({ _id: multimediaDoc._id }).exec();
      }
      await this.commentModel.deleteMany({ post: new Types.ObjectId(postId) }).exec();
      await this.feedModel.findByIdAndDelete(postId).exec();
    } catch (err) {
      throw new Error(`Error deleting from database: ${err}`);
    }

    // Limpieza de archivos en disco
    try {
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
    } catch (_) { }

    void this.eventEmitter.emit('post.deleted', { _id: postId, author: actorId });
    return { success: true };
  }



  // BUSCA Y DEVUELVE EXCLUSIVAMENTE LAS PUBLICACIONES QUE CONTIENEN MULTIMEDIA PERTENECIENTES A UN AUTOR ESPECIFICO
  async getPostsByAuthor(authorId: string, limit = 50) {
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid author id');
    const posts = await this.feedModel
      .find({
        author: new Types.ObjectId(authorId),
        multimediaId: { $exists: true, $ne: null },
      })
      .select(`
        _id description type author
        authorFirstName authorLastName
        multimediaId multimediaUrl thumbnailUrl multimediaStatus
        likes likesCount commentsCount
        shares views createdAt updatedAt
      `)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return posts.map((doc: any) => ({
      _id: doc._id,
      description: doc.description,
      type: doc.type,
      author: doc.author?.toString(),
      authorFirstName: doc.authorFirstName || undefined,
      authorLastName: doc.authorLastName || undefined,
      multimediaId: doc.multimediaId,
      multimediaUrl: doc.multimediaUrl || undefined,
      thumbnailUrl: doc.thumbnailUrl || undefined,
      likes: Array.isArray(doc.likes) ? doc.likes.map((id: any) => id?.toString()) : [],
      likesCount: typeof doc.likesCount === 'number' ? doc.likesCount : (Array.isArray(doc.likes) ? doc.likes.length : 0),
      commentsCount: typeof doc.commentsCount === 'number' ? doc.commentsCount : 0,
      shares: doc.shares || 0,
      views: doc.views || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }
}
