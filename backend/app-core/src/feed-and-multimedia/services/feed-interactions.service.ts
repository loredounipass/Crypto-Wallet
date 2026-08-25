import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FeedRepository } from '../feed.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FeedInteractionsService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get feedModel() {
    return this.feedRepository.feed;
  }



  // AGREGA EL IDENTIFICADOR DEL USUARIO A LA LISTA DE ME GUSTA DE LA PUBLICACION ACTUALIZANDO SU ESTADISTICA
  async likePost(postId: string, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    if (!actorId || !Types.ObjectId.isValid(actorId)) throw new BadRequestException('Invalid actor id');
    const oid = new Types.ObjectId(actorId);
    const pipeline: any[] = [
      { $set: { likes: { $setUnion: ['$likes', [oid]] } } },
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



  // RETIRA EL IDENTIFICADOR DEL USUARIO DE LA LISTA DE ME GUSTA Y RECALCULA EL TOTAL DE INTERACCIONES DE LA PUBLICACION
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



  // SUMA UNA NUEVA VISUALIZACION A LA PUBLICACION CUANDO EL USUARIO LA OBSERVA DESDE SU DISPOSITIVO
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



  // INCREMENTA EL CONTADOR QUE INDICA CUANTAS VECES HA SIDO COMPARTIDA ESTA PUBLICACION CON TERCEROS
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
}
