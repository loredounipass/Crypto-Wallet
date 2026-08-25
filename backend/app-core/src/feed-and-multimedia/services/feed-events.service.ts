import { Injectable, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FeedRepository } from '../feed.repository';
import { MultimediaRepository } from '../../messages-and-multimedia/messages-and-multimedia.module';
import { FeedPostsService } from './feed-posts.service';

@Injectable()
export class FeedEventsService implements OnModuleInit {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly multimediaRepository: MultimediaRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly feedPostsService: FeedPostsService,
  ) {}

  private get feedModel() {
    return this.feedRepository.feed;
  }

  private get multimediaModel() {
    return this.multimediaRepository.model;
  }



  // CONFIGURA LOS EVENTOS DEL SISTEMA PARA MANTENER SINCRONIZADOS LOS ESTADOS MULTIMEDIA Y LA INFORMACION DEL AUTOR
  onModuleInit() {
    try {
      try { void (this.eventEmitter as any).removeAllListeners('multimedia.ready'); } catch (_) { }
      try { void (this.eventEmitter as any).removeAllListeners('multimedia.failed'); } catch (_) { }
      this.eventEmitter.on('multimedia.ready', async (payload: any) => {
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
            const out = await this.feedPostsService.getPostById(postDoc._id?.toString());
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
            try {
              await this.feedModel.updateOne({ _id: postDoc._id }, { $set: { multimediaStatus: 'failed' } }).exec();
            } catch (e) { console.warn('Failed to update post multimediaStatus to failed', e); }
            const out = await this.feedPostsService.getPostById(postDoc._id?.toString());
            void this.eventEmitter.emit('post.updated', out);
          } catch (err) {
            console.warn('multimedia.failed handler error', err);
          }
        } catch (_) { }
      });
      try { void (this.eventEmitter as any).removeAllListeners('user.updated'); } catch (_) { }
      this.eventEmitter.on('user.updated', async (payload: any) => {
        try {
          const userId = payload?._id || payload?.id || payload?.userId;
          if (!userId) return;
          const firstName = payload?.firstName;
          const lastName = payload?.lastName;
          if (firstName === undefined && lastName === undefined) return;
          try {
            await this.feedModel.updateMany({ author: new Types.ObjectId(userId) }, { $set: { authorFirstName: firstName || undefined, authorLastName: lastName || undefined } }).exec();
          } catch (e) {
            console.warn('Failed to update FeedPost author names for user', userId, e);
          }
          try {
            const posts = await this.feedModel.find({ author: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(200).select('_id').lean().exec();
            for (const p of posts) {
              try {
                const out = await this.feedPostsService.getPostById(p._id?.toString());
                void this.eventEmitter.emit('post.updated', out);
              } catch (_) { }
            }
          } catch (e) { console.warn('Failed to emit post.updated after author name sync', e); }
        } catch (err) { console.warn('user.updated handler error', err); }
      });
    } catch (_) { }
  }
}
