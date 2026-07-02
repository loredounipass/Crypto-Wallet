import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeedPost, FeedPostDocument } from './schemas/feed.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Multimedia, MultimediaDocument } from '../messages-and-multimedia/schemas/multimedia.schema';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { FeedRepository } from './feed.repository';
import { MultimediaRepository } from '../messages-and-multimedia/messages-and-multimedia.module';
import { UserRepository } from 'src/repositories/user.repository';
import { Types as MongooseTypes } from 'mongoose';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserService } from 'src/user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { LocalStorageProvider } from 'src/storage/local.storage.provider';
import * as crypto from 'crypto';

@Injectable()
export class FeedAndMultimediaService implements OnModuleInit {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly multimediaRepository: MultimediaRepository,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('multimedia') private readonly multimediaQueue: Queue,
    private readonly storage: LocalStorageProvider,
  ) { }

  private get feedModel() {
    return this.feedRepository.feed;
  }

  private get commentModel() {
    return this.feedRepository.comment;
  }

  private get multimediaModel() {
    return this.multimediaRepository.model;
  }

  private get userModel() {
    return this.userRepository.model;
  }



  // Listen to multimedia processing events to update feed posts when media becomes ready
  onModuleInit() {
    try {
      // avoid double-registering handlers during hot-reload/dev
      try { void (this.eventEmitter as any).removeAllListeners('multimedia.ready'); } catch (_) { }
      try { void (this.eventEmitter as any).removeAllListeners('multimedia.failed'); } catch (_) { }

      this.eventEmitter.on('multimedia.ready', async (payload: any) => {
        try {
          const mmId = payload?.multimediaId;
          const postId = payload?.messageId; // we use messageId slot to carry postId for feed uploads
          if (!mmId) return;
          // Find related feed post either by _id == postId or by multimediaId == mmId
          let postDoc: any = null;
          if (postId && Types.ObjectId.isValid(postId)) {
            postDoc = await this.feedModel.findById(postId).lean().exec();
          }
          if (!postDoc) {
            postDoc = await this.feedModel.findOne({ multimediaId: new Types.ObjectId(mmId) }).lean().exec();
          }
          if (!postDoc) return;

          // fetch multimedia doc and persist denormalized fields into post
          try {
            const mm = await this.multimediaModel.findById(mmId).lean().exec().catch(() => undefined);
            if (mm) {
              try {
                await this.feedModel.updateOne({ _id: postDoc._id }, {
                  $set: {
                    multimediaUrl: mm.url || undefined,
                    thumbnailUrl: mm.thumbnailUrl || undefined,
                    multimediaStatus: mm.status || undefined,
                  }
                }).exec();
              } catch (e) {
                console.warn('Failed to update FeedPost denormalized multimedia fields', e);
              }
            }

            const out = await this.getPostById(postDoc._id?.toString());
            void this.eventEmitter.emit('post.updated', out);
          } catch (err) {
            console.warn('multimedia.ready handler error', err);
          }
        } catch (_) { }
      });

      this.eventEmitter.on('multimedia.failed', async (payload: any) => {
        try {
          const mmId = payload?.multimediaId;
          const postId = payload?.messageId;
          if (!mmId) return;
          let postDoc: any = null;
          if (postId && Types.ObjectId.isValid(postId)) {
            postDoc = await this.feedModel.findById(postId).lean().exec();
          }
          if (!postDoc) {
            postDoc = await this.feedModel.findOne({ multimediaId: new Types.ObjectId(mmId) }).lean().exec();
          }
          if (!postDoc) return;
          try {
            // mark post multimediaStatus as failed
            try {
              await this.feedModel.updateOne({ _id: postDoc._id }, { $set: { multimediaStatus: 'failed' } }).exec();
            } catch (e) { console.warn('Failed to update post multimediaStatus to failed', e); }

            const out = await this.getPostById(postDoc._id?.toString());
            void this.eventEmitter.emit('post.updated', out);
          } catch (err) {
            console.warn('multimedia.failed handler error', err);
          }
        } catch (_) { }
      });

      // listen for user profile updates to sync denormalized author names on posts
      try { void (this.eventEmitter as any).removeAllListeners('user.updated'); } catch (_) { }
      this.eventEmitter.on('user.updated', async (payload: any) => {
        try {
          const userId = payload?._id || payload?.id || payload?.userId;
          if (!userId) return;
          const firstName = payload?.firstName;
          const lastName = payload?.lastName;
          if (firstName === undefined && lastName === undefined) return;

          // update all posts for this author
          try {
            await this.feedModel.updateMany({ author: new Types.ObjectId(userId) }, { $set: { authorFirstName: firstName || undefined, authorLastName: lastName || undefined } }).exec();
          } catch (e) {
            console.warn('Failed to update FeedPost author names for user', userId, e);
          }

          // emit updated events for affected posts (limit to avoid storms: only most recent 200)
          try {
            const posts = await this.feedModel.find({ author: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(200).select('_id').lean().exec();
            for (const p of posts) {
              try {
                const out = await this.getPostById(p._id?.toString());
                void this.eventEmitter.emit('post.updated', out);
              } catch (_) { }
            }
          } catch (e) { console.warn('Failed to emit post.updated after author name sync', e); }

        } catch (err) { console.warn('user.updated handler error', err); }
      });
    } catch (_) { }
  }



  // get the piost by id, including denormalized author names and multimedia fields; lean query for performance; throw if not found
  async getPostById(postId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');

    // load post lean
    const post = await this.feedModel.findById(postId).lean().exec();
    if (!post) throw new NotFoundException('Post not found');

    // Use denormalized counters, author names and multimedia fields from post to avoid extra lookups
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



  // Create a post without file upload: validate multimediaId if provided, denormalize author names and multimedia fields, create post
  async createPost(dto: CreatePostDto, authorId: string) {
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid authorId');
    // ensure actor exists and fetch display names
    const actor = await this.userService.getUserById(authorId);
    if (!actor) throw new NotFoundException('Author not found');

    const postPayload: any = {
      description: dto.description,
      type: dto.type,
      author: new Types.ObjectId(authorId),
      authorFirstName: actor.firstName || undefined,
      authorLastName: actor.lastName || undefined,
      likesCount: 0,
      commentsCount: 0,
    };

    if (dto.multimediaId && Types.ObjectId.isValid(dto.multimediaId)) {
      // fetch multimedia once to denormalize fields when provided
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



  // Create a post from an uploaded file: store staging, create Multimedia doc, create FeedPost, enqueue processing
  async createPostWithFile(file: any, body: any, authorId: string) {
    if (!file) throw new BadRequestException('File is required');
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid authorId');

    const dto: CreatePostDto = {
      description: body.description || '',
      type: body.type || (file.mimetype && file.mimetype.startsWith('video') ? 'video' : 'image'),
      authorId: authorId,
    } as CreatePostDto;

    // upload to staging first
    const stagingKey = `staging/${crypto.randomUUID()}-${file.originalname}`;
    const uploadResult = await this.storage.upload(file.buffer, stagingKey, file.mimetype);

    // Use transaction to guarantee consistency between multimedia and feed post.
    // Also persist processingJob within multimedia (outbox-like) so background worker can enqueue if needed.
    const actor = await this.userService.getUserById(authorId);
    if (!actor) {
      // cleanup upload
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
      // Try transactional path first
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

          // link multimedia -> post (atomic update within session) - going through repository if available
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
        // Detect servers that don't support transactions (standalone mongod)
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

      // If transactional path wasn't used (standalone server), perform non-transactional but compensating operations
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

          // link multimedia -> post
          await this.multimediaModel.updateOne({ _id: createdMultimediaDoc._id }, { $set: { message: createdPostDoc._id, status: 'processing', url: uploadResult.url } }).exec();

          createdPostId = createdPostDoc._id?.toString();
        } catch (nonTxErr) {
          // cleanup created docs and uploaded file if possible
          try { if (createdMultimediaDoc && createdMultimediaDoc._id) await this.multimediaModel.deleteOne({ _id: createdMultimediaDoc._id }).exec(); } catch (_) { }
          try { if (createdPostDoc && createdPostDoc._id) await this.feedModel.deleteOne({ _id: createdPostDoc._id }).exec(); } catch (_) { }
          try { await this.storage.delete(uploadResult.key) } catch (_) { }
          throw nonTxErr;
        }
      }
    } catch (err) {
      // compensating: delete uploaded file to avoid orphan if nothing was committed
      try { await this.storage.delete(uploadResult.key) } catch (_) { }
      throw err;
    } finally {
      try { session.endSession(); } catch (_) { }
    }

    if (!createdPostId) throw new Error('Failed to create post');

    // Try to enqueue the processing job. If enqueue fails, the multimedia doc contains
    // `processingJob` so a background reconciler can pick it up (basic outbox).
    try {
      await this.multimediaQueue.add('process', {
        stagingKey: uploadResult.key,
        multimediaId: multimediaIdCreated?.toString(),
        messageId: createdPostId,
        ownerId: authorId,
        mimeType: file.mimetype,
      });

      // mark as enqueued
      try {
        await this.multimediaModel.updateOne({ _id: multimediaIdCreated }, { $set: { 'processingJob.enqueued': true } }).exec();
      } catch (_) { }
    } catch (err) {
      // leave processingJob.enqueued = false so a background reconciler can find it
    }

    const out = await this.getPostById(createdPostId);
    void this.eventEmitter.emit('post.created', out);
    return out;
  }




  // Video feed: return only posts with video type or video multimedia URL
  async getVideoFeed(limit = 100) {
    const posts = await this.feedModel
      .find({
        $or: [
          { type: 'video' },
          { multimediaUrl: { $regex: /\.(mp4|webm|ogg|mov|mkv)/i } },
        ],
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

    // Further client-side filter: only include posts that actually have a video URL
    return posts
      .filter((doc: any) => {
        const url = doc.multimediaUrl || '';
        return (
          doc.type === 'video' ||
          /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url)
        );
      })
      .map((doc: any) => ({
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


  // Public/global feed: return recent posts visible to any authenticated user
  async getFeed(limit = 50) {
    const posts = await this.feedModel
      .find({})
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




  // Update post: only allow author to update; allow updating description, type and multimedia (with validation); if multimedia is updated, denormalize new multimedia fields and remove old multimedia doc + storage asset
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



  // Delete post: only allow author to delete; transactionally remove post, comments and multimedia doc; best-effort remove storage asset after transaction
  async deletePost(postId: string, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).lean().exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author?.toString() !== actorId) throw new ForbiddenException('Not allowed');

    // transactionally remove post, comments and multimedia doc; remove storage file after commit
    const session = await this.feedModel.db.startSession();
    let multimediaDoc: any = undefined;
    try {
      await session.withTransaction(async () => {
        // load multimedia doc within transaction if exists
        if (post.multimediaId) {
          multimediaDoc = await this.multimediaModel.findById(post.multimediaId).session(session).lean().exec();
          if (multimediaDoc) {
            await this.multimediaModel.deleteOne({ _id: multimediaDoc._id }).session(session).exec();
          }
        }

        // delete comments
        await this.commentModel.deleteMany({ post: new Types.ObjectId(postId) }).session(session).exec();

        // delete post
        await this.feedModel.findByIdAndDelete(postId).session(session).exec();
      });
    } finally {
      session.endSession();
    }

    // best-effort remove storage asset(s) outside transaction
    try {
      const key = multimediaDoc?.processingJob?.stagingKey;
      if (key) await this.storage.delete(key);
    } catch (_) { }

    void this.eventEmitter.emit('post.deleted', { _id: postId, author: actorId });
    return { success: true };
  }



  // Comments: create, get for post, like/unlike, delete (only author); when creating comment, increment commentsCount on post; when deleting, decrement commentsCount (best-effort)
  async addComment(dto: CreateCommentDto, authorId: string) {
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid author');
    const author = await this.userService.getUserById(authorId);
    if (!author) throw new NotFoundException('Author not found');

    const post = await this.feedModel.findById(dto.postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    // Attempt transactional path, but fall back for standalone Mongo servers that don't support transactions
    const session = await this.commentModel.db.startSession();
    let created: any = undefined;
    let usedTransaction = false;
    try {
      try {
        await session.withTransaction(async () => {
          const commentPayload: any = {
            content: dto.content,
            author: new Types.ObjectId(authorId),
            post: new Types.ObjectId(dto.postId),
            likes: [],
            likesCount: 0,
          };
          if (dto.parentId && Types.ObjectId.isValid(dto.parentId)) commentPayload.parent = new Types.ObjectId(dto.parentId);
          const docs = await this.commentModel.create([commentPayload], { session });
          created = Array.isArray(docs) ? docs[0] : docs;

          await this.feedModel.findByIdAndUpdate(dto.postId, { $inc: { commentsCount: 1 } }, { session }).exec();
        });
        usedTransaction = true;
      } catch (txErr) {
        const msg = String((txErr as any)?.message || '').toLowerCase();
        if (msg.includes('transaction numbers are only allowed') || msg.includes('transactions are not supported')) {
          // fallback to non-transactional flow below
        } else {
          throw txErr;
        }
      }

      if (!usedTransaction) {
        // Non-transactional fallback: create comment then increment counter; if increment fails, remove comment
        const commentPayload: any = { content: dto.content, author: new Types.ObjectId(authorId), post: new Types.ObjectId(dto.postId), likes: [], likesCount: 0 };
        if (dto.parentId && Types.ObjectId.isValid(dto.parentId)) commentPayload.parent = new Types.ObjectId(dto.parentId);
        created = await this.commentModel.create(commentPayload);
        try {
          const upd = await this.feedModel.findByIdAndUpdate(dto.postId, { $inc: { commentsCount: 1 } }).exec();
          if (!upd) {
            // rollback
            try { await this.commentModel.deleteOne({ _id: created._id }).exec(); } catch (_) { }
            throw new BadRequestException('Post not found');
          }
        } catch (err) {
          try { await this.commentModel.deleteOne({ _id: created._id }).exec(); } catch (_) { }
          throw err;
        }
      }
    } finally {
      try { session.endSession(); } catch (_) { }
    }

    // attach author names using a single query
    const userDoc: any = await this.userModel.findById(created.author).select('firstName lastName').lean().exec().catch(() => undefined);

    const out = {
      _id: created._id?.toString(),
      content: created.content,
      author: created.author?.toString(),
      authorFirstName: userDoc?.firstName || undefined,
      authorLastName: userDoc?.lastName || undefined,
      post: created.post?.toString(),
      parent: created.parent?.toString(),
      createdAt: (created as any).createdAt,
    };

    void this.eventEmitter.emit('comment.created', out);
    return out;
  }



  // Get comments for a post: return comments sorted by createdAt desc; include author display names; use lean query and batch load authors to avoid N+1
  async getCommentsForPost(postId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const comments = await this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .select('_id content author post parent likes likesCount createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Batch load all author user docs to avoid N+1
    const authorIds = Array.from(new Set(comments.filter((c: any) => c.author).map((c: any) => c.author.toString())));
    const users: any[] = authorIds.length > 0 ? await this.userModel.find({ _id: { $in: authorIds } }).select('firstName lastName username').lean().exec() : [];
    const userMap = new Map(users.map(u => [u._id?.toString(), u]));

    // Build a map from comment id -> author display name to be able to show parent author names
    const commentAuthorNameMap = new Map<string, string>();
    for (const c of comments) {
      const aid = c.author?.toString();
      const u = userMap.get(aid);
      const name = u ? ((u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (u.username || 'Usuario')) : 'Usuario';
      if (c._id) commentAuthorNameMap.set(c._id?.toString(), name);
    }

    return comments.map((c: any) => ({
      _id: c._id,
      content: c.content,
      author: c.author?.toString(),
      authorFirstName: userMap.get(c.author?.toString())?.firstName || undefined,
      authorLastName: userMap.get(c.author?.toString())?.lastName || undefined,
      post: c.post?.toString(),
      parent: c.parent?.toString() || undefined,
      parentAuthorName: c.parent ? commentAuthorNameMap.get(c.parent?.toString()) : undefined,
      likes: Array.isArray(c.likes) ? c.likes.map((id: any) => id?.toString()) : [],
      likesCount: typeof c.likesCount === 'number' ? c.likesCount : (Array.isArray(c.likes) ? c.likes.length : 0),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }



  // Like/unlike comment: atomically add/remove actor from likes array and recalc likesCount using aggregation pipeline; return updated comment; throw if comment not found; emit comment.updated event with post id for potential denormalized counter updates
  async likeComment(commentId: string, actorId: string) {
    if (!commentId || !Types.ObjectId.isValid(commentId)) throw new BadRequestException('Invalid comment id');
    if (!actorId || !Types.ObjectId.isValid(actorId)) throw new BadRequestException('Invalid actor id');
    const oid = new Types.ObjectId(actorId);
    const pipeline: any[] = [
      { $set: { likes: { $setUnion: ['$likes', [oid]] } } },
      { $set: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
    ];
    const updated = await this.commentModel.findOneAndUpdate({ _id: commentId } as any, pipeline as any, { returnDocument: 'after', lean: true }).exec();
    if (!updated) throw new NotFoundException('Comment not found');

    const out = {
      _id: updated._id?.toString(),
      content: updated.content,
      author: updated.author?.toString(),
      post: updated.post?.toString(),
      parent: updated.parent?.toString() || undefined,
      likes: Array.isArray(updated.likes) ? updated.likes.map((id: any) => id?.toString()) : [],
      likesCount: typeof updated.likesCount === 'number' ? updated.likesCount : (Array.isArray(updated.likes) ? updated.likes.length : 0),
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    };

    try { void this.eventEmitter.emit('comment.updated', { _id: out._id, post: out.post }); } catch (_) { }
    return out;
  }



  // Like/unlike comment: atomically add/remove actor from likes array and recalc likesCount using aggregation pipeline; return updated comment; throw if comment not found; emit comment.updated event with post id for potential denormalized counter updates
  async unlikeComment(commentId: string, actorId: string) {
    if (!commentId || !Types.ObjectId.isValid(commentId)) throw new BadRequestException('Invalid comment id');
    if (!actorId || !Types.ObjectId.isValid(actorId)) throw new BadRequestException('Invalid actor id');
    const oid = new Types.ObjectId(actorId);
    const pipeline: any[] = [
      { $set: { likes: { $filter: { input: '$likes', as: 'u', cond: { $ne: ['$$u', oid] } } } } },
      { $set: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
    ];
    const updated = await this.commentModel.findOneAndUpdate({ _id: commentId } as any, pipeline as any, { returnDocument: 'after', lean: true }).exec();
    if (!updated) throw new NotFoundException('Comment not found');

    const out = {
      _id: updated._id?.toString(),
      content: updated.content,
      author: updated.author?.toString(),
      post: updated.post?.toString(),
      parent: updated.parent?.toString() || undefined,
      likes: Array.isArray(updated.likes) ? updated.likes.map((id: any) => id?.toString()) : [],
      likesCount: typeof updated.likesCount === 'number' ? updated.likesCount : (Array.isArray(updated.likes) ? updated.likes.length : 0),
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    };

    try { void this.eventEmitter.emit('comment.updated', { _id: out._id, post: out.post }); } catch (_) { }
    return out;
  }



  // Delete comment: only allow author to delete; decrement commentsCount on post (best-effort); emit comment.deleted event with post id for potential denormalized counter updates
  async deleteComment(commentId: string, actorId: string) {
    if (!commentId || !Types.ObjectId.isValid(commentId)) throw new BadRequestException('Invalid comment id');
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author.toString() !== actorId) throw new ForbiddenException('Not allowed');

    await this.commentModel.findByIdAndDelete(commentId).exec();

    // decrement denormalized commentsCount on post (best-effort)
    try {
      await this.feedModel.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } }).exec();
    } catch (err) {
      console.warn('Failed to decrement commentsCount for post on comment delete', err);
    }

    void this.eventEmitter.emit('comment.deleted', { _id: commentId, post: comment.post?.toString() });
    return { success: true };
  }



  // Like/unlike post: atomically add/remove actor from likes array and recalc likesCount using aggregation pipeline; return updated post; throw if post not found; emit post.updated event
  async likePost(postId: string, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    if (!actorId || !Types.ObjectId.isValid(actorId)) throw new BadRequestException('Invalid actor id');
    // Use aggregation-style update pipeline to atomically add actor to likes and recalc likesCount
    const oid = new Types.ObjectId(actorId);
    const pipeline: any[] = [
      { $set: { likes: { $setUnion: ['$likes', [oid]] } } },
      { $set: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
    ];

    // Perform findOneAndUpdate and return the post after modification to avoid a second read
    const updated = await this.feedModel.findOneAndUpdate({ _id: postId } as any, pipeline as any, { returnDocument: 'after', lean: true }).exec();
    if (!updated) throw new NotFoundException('Post not found');

    const out = {
      _id: updated._id?.toString(),
      description: updated.description,
      type: updated.type,
      author: updated.author?.toString(),
      authorFirstName: (updated as any).authorFirstName || undefined,
      authorLastName: (updated as any).authorLastName || undefined,
      multimediaId: (updated as any).multimediaId,
      multimediaUrl: (updated as any).multimediaUrl || undefined,
      thumbnailUrl: (updated as any).thumbnailUrl || undefined,
      likes: Array.isArray(updated.likes) ? updated.likes.map((id: any) => id?.toString()) : [],
      likesCount: typeof (updated as any).likesCount === 'number' ? (updated as any).likesCount : (Array.isArray(updated.likes) ? updated.likes.length : 0),
      commentsCount: typeof (updated as any).commentsCount === 'number' ? (updated as any).commentsCount : 0,
      shares: updated.shares || 0,
      views: updated.views || 0,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    };

    void this.eventEmitter.emit('post.updated', out);
    return out;
  }


  // Like/unlike post: atomically add/remove actor from likes array and recalc likesCount using aggregation pipeline; return updated post; throw if post not found; emit post.updated event
  async unlikePost(postId: string, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    if (!actorId || !Types.ObjectId.isValid(actorId)) throw new BadRequestException('Invalid actor id');
    const oid = new Types.ObjectId(actorId);
    const pipeline: any[] = [
      { $set: { likes: { $filter: { input: '$likes', as: 'u', cond: { $ne: ['$$u', oid] } } } } },
      { $set: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
    ];

    const updated = await this.feedModel.findOneAndUpdate({ _id: postId } as any, pipeline as any, { returnDocument: 'after', lean: true }).exec();
    if (!updated) throw new NotFoundException('Post not found');

    const out = {
      _id: updated._id?.toString(),
      description: updated.description,
      type: updated.type,
      author: updated.author?.toString(),
      authorFirstName: (updated as any).authorFirstName || undefined,
      authorLastName: (updated as any).authorLastName || undefined,
      multimediaId: (updated as any).multimediaId,
      multimediaUrl: (updated as any).multimediaUrl || undefined,
      thumbnailUrl: (updated as any).thumbnailUrl || undefined,
      likes: Array.isArray(updated.likes) ? updated.likes.map((id: any) => id?.toString()) : [],
      likesCount: typeof (updated as any).likesCount === 'number' ? (updated as any).likesCount : (Array.isArray(updated.likes) ? updated.likes.length : 0),
      commentsCount: typeof (updated as any).commentsCount === 'number' ? (updated as any).commentsCount : 0,
      shares: updated.shares || 0,
      views: updated.views || 0,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    };

    void this.eventEmitter.emit('post.updated', out);
    return out;
  }



  // Increment view count on post: atomically increment views by 1; return updated post; throw if post not found; emit post.updated event
  async incrementView(postId: string, actorId?: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const updated = await this.feedModel.findOneAndUpdate({ _id: postId } as any, { $inc: { views: 1 } } as any, { returnDocument: 'after', lean: true }).exec();
    if (!updated) throw new NotFoundException('Post not found');

    const out = {
      _id: updated._id?.toString(),
      description: updated.description,
      type: updated.type,
      author: updated.author?.toString(),
      authorFirstName: (updated as any).authorFirstName || undefined,
      authorLastName: (updated as any).authorLastName || undefined,
      multimediaId: (updated as any).multimediaId,
      multimediaUrl: (updated as any).multimediaUrl || undefined,
      thumbnailUrl: (updated as any).thumbnailUrl || undefined,
      likesCount: typeof (updated as any).likesCount === 'number' ? (updated as any).likesCount : (Array.isArray(updated.likes) ? updated.likes.length : 0),
      commentsCount: typeof (updated as any).commentsCount === 'number' ? (updated as any).commentsCount : 0,
      shares: updated.shares || 0,
      views: updated.views || 0,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    };

    void this.eventEmitter.emit('post.updated', out);
    return out;
  }


  // Increment share count on a post: atomically increment shares by 1; return updated post; emit post.updated
  async incrementShare(postId: string, actorId?: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const updated = await this.feedModel.findOneAndUpdate({ _id: postId } as any, { $inc: { shares: 1 } } as any, { returnDocument: 'after', lean: true }).exec();
    if (!updated) throw new NotFoundException('Post not found');

    const out = {
      _id: updated._id?.toString(),
      description: updated.description,
      type: updated.type,
      author: updated.author?.toString(),
      authorFirstName: (updated as any).authorFirstName || undefined,
      authorLastName: (updated as any).authorLastName || undefined,
      multimediaId: (updated as any).multimediaId,
      multimediaUrl: (updated as any).multimediaUrl || undefined,
      thumbnailUrl: (updated as any).thumbnailUrl || undefined,
      likesCount: typeof (updated as any).likesCount === 'number' ? (updated as any).likesCount : (Array.isArray(updated.likes) ? updated.likes.length : 0),
      commentsCount: typeof (updated as any).commentsCount === 'number' ? (updated as any).commentsCount : 0,
      shares: updated.shares || 0,
      views: updated.views || 0,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    };

    try { void this.eventEmitter.emit('post.updated', out); } catch (_) { }
    return out;
  }

  // Get posts by author (public): return only posts with media (image or video) for a specific user
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
