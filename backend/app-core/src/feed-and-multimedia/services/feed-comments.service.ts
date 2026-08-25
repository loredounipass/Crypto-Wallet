import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { FeedRepository } from '../feed.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { UserService } from 'src/user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FeedCommentsService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get feedModel() {
    return this.feedRepository.feed;
  }

  private get commentModel() {
    return this.feedRepository.comment;
  }

  private get userModel() {
    return this.userRepository.model;
  }



  // REGISTRA UN NUEVO COMENTARIO EN UNA PUBLICACION Y ACTUALIZA ATOMICAMENTE EL CONTADOR TOTAL DEL POST
  async addComment(dto: CreateCommentDto, authorId: string) {
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid author');
    const author = await this.userService.getUserById(authorId);
    if (!author) throw new NotFoundException('Author not found');
    const post = await this.feedModel.findById(dto.postId).exec();
    if (!post) throw new NotFoundException('Post not found');
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
        } else {
          throw txErr;
        }
      }
      if (!usedTransaction) {
        const commentPayload: any = { content: dto.content, author: new Types.ObjectId(authorId), post: new Types.ObjectId(dto.postId), likes: [], likesCount: 0 };
        if (dto.parentId && Types.ObjectId.isValid(dto.parentId)) commentPayload.parent = new Types.ObjectId(dto.parentId);
        created = await this.commentModel.create(commentPayload);
        try {
          const upd = await this.feedModel.findByIdAndUpdate(dto.postId, { $inc: { commentsCount: 1 } }).exec();
          if (!upd) {
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



  // OBTIENE LA LISTA DE COMENTARIOS DE UNA PUBLICACION INCLUYENDO LOS NOMBRES DE LOS AUTORES SIN CONSULTAS EXTRA
  async getCommentsForPost(postId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const comments = await this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .select('_id content author post parent likes likesCount createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const authorIds = Array.from(new Set(comments.filter((c: any) => c.author).map((c: any) => c.author.toString())));
    const users: any[] = authorIds.length > 0 ? await this.userModel.find({ _id: { $in: authorIds } }).select('firstName lastName username').lean().exec() : [];
    const userMap = new Map(users.map(u => [u._id?.toString(), u]));
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



  // SUMA EL VOTO DE UN USUARIO A UN COMENTARIO Y RECALCULA EL CONTADOR TOTAL MEDIANTE UNA TRANSACCION ATOMICA
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



  // REMUEVE EL VOTO DE UN USUARIO SOBRE UN COMENTARIO ASEGURANDO LA CONSISTENCIA DEL CONTADOR EN LA BASE DE DATOS
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



  // BORRA EL COMENTARIO DE LA BASE DE DATOS Y DECREMENTA EL CONTADOR ASOCIADO EN LA PUBLICACION ORIGINAL
  async deleteComment(commentId: string, actorId: string) {
    if (!commentId || !Types.ObjectId.isValid(commentId)) throw new BadRequestException('Invalid comment id');
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author.toString() !== actorId) throw new ForbiddenException('Not allowed');
    await this.commentModel.findByIdAndDelete(commentId).exec();
    try {
      await this.feedModel.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } }).exec();
    } catch (err) {
      console.warn('Failed to decrement commentsCount for post on comment delete', err);
    }
    void this.eventEmitter.emit('comment.deleted', { _id: commentId, post: comment.post?.toString() });
    return { success: true };
  }
}
