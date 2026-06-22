import { Logger, Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { REDIS_CLIENT } from '../redis/redis.module';

@WebSocketGateway({ namespace: '/feed', cors: { origin: [process.env.CORS_ORIGIN], credentials: true } })
export class FeedGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('FeedGateway');

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: any,
  ) {}

  private parseCookies(cookieHeader: string | undefined) {
    const rc = cookieHeader || '';
    return rc.split(';').map(c => c.trim()).filter(Boolean).reduce((acc: any, item) => {
      const idx = item.indexOf('=');
      if (idx > -1) {
        const k = item.substring(0, idx);
        const v = item.substring(idx + 1);
        acc[k] = decodeURIComponent(v);
      }
      return acc;
    }, {});
  }

  async handleConnection(client: Socket) {
    try {
      const cookies = this.parseCookies(client.handshake.headers.cookie as string | undefined);
      const rawSid = cookies['connect.sid'] || cookies['sid'] || null;
      if (!rawSid) {
        this.logger.warn(`No session cookie present for socket ${client.id}`);
        void client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      let sid = rawSid;
      if (sid.startsWith('s:')) sid = sid.slice(2).split('.')[0];

      const sess = await this.getSession(sid);
      if (!sess) {
        void client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      const passportUser = sess.passport && sess.passport.user ? sess.passport.user : null;
      if (!passportUser) {
        void client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      client.data.user = passportUser;
      const userId = passportUser._id.toString();
      client.join(`user:${userId}`);
      this.logger.log(`Socket ${client.id} authenticated and joined user:${userId}`);
    } catch (e) {
      this.logger.error(`Error during socket auth for ${client.id}: ${e}`);
      void client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  private async getSession(sid: string): Promise<any> {
    try {
      const sessionKey = `sess:${sid}`;
      const sessionData = await this.redisClient.get(sessionKey);
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch (err) {
      this.logger.error(`Error retrieving session ${sid}:`, err);
      return null;
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('post.created')
  async handlePostCreated(payload: any) {
    try {
      // emit sanitized post payload to author's sockets and any post-specific room
      const authorId = payload.author;
      if (!authorId) return;
      const out = {
        _id: payload._id,
        description: payload.description,
        type: payload.type,
        author: payload.author,
        authorFirstName: payload.authorFirstName || undefined,
        authorLastName: payload.authorLastName || undefined,
        multimediaId: payload.multimediaId || undefined,
        multimediaUrl: payload.multimediaUrl || undefined,
        thumbnailUrl: payload.thumbnailUrl || undefined,
        likesCount: typeof payload.likesCount === 'number' ? payload.likesCount : undefined,
        commentsCount: typeof payload.commentsCount === 'number' ? payload.commentsCount : undefined,
        shares: payload.shares || 0,
        views: payload.views || 0,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      };

      const authorSockets = await this.server.in(`user:${authorId}`).allSockets();
      for (const s of authorSockets) void this.server.to(s).emit('postCreated', out);
    } catch (e) {
      this.logger.warn(`Error emitting post.created: ${e}`);
    }
  }

  @OnEvent('post.updated')
  async handlePostUpdated(payload: any) {
    try {
      const authorId = payload.author;
      if (!authorId) return;

      const out = {
        _id: payload._id,
        description: payload.description,
        type: payload.type,
        author: payload.author,
        authorFirstName: payload.authorFirstName || undefined,
        authorLastName: payload.authorLastName || undefined,
        multimediaId: payload.multimediaId || undefined,
        multimediaUrl: payload.multimediaUrl || undefined,
        thumbnailUrl: payload.thumbnailUrl || undefined,
        likesCount: typeof payload.likesCount === 'number' ? payload.likesCount : undefined,
        commentsCount: typeof payload.commentsCount === 'number' ? payload.commentsCount : undefined,
        shares: payload.shares || 0,
        views: payload.views || 0,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      };

      const authorSockets = await this.server.in(`user:${authorId}`).allSockets();
      for (const s of authorSockets) void this.server.to(s).emit('postUpdated', out);

      // also notify any post room subscribers
      const postId = payload._id;
      if (postId) {
      const sockets = await this.server.in(`post:${postId}`).allSockets();
      for (const s of sockets) void this.server.to(s).emit('postUpdated', out);
      }
    } catch (e) {
      this.logger.warn(`Error emitting post.updated: ${e}`);
    }
  }

  @OnEvent('comment.created')
  async handleCommentCreated(payload: any) {
    try {
      const postId = payload.post;
      if (!postId) return;
      const postRoom = `post:${postId}`;
      const out = {
        _id: payload._id,
        content: payload.content,
        author: payload.author,
        authorFirstName: payload.authorFirstName || undefined,
        authorLastName: payload.authorLastName || undefined,
        post: payload.post,
        createdAt: payload.createdAt,
      };

      const sockets = await this.server.in(postRoom).allSockets();
      for (const s of sockets) void this.server.to(s).emit('commentCreated', out);

      // also notify the post author via user room if included in payload
      if (payload.author) {
        const authorSockets = await this.server.in(`user:${payload.author}`).allSockets();
        for (const s of authorSockets) void this.server.to(s).emit('commentCreated', out);
      }
    } catch (e) {
      this.logger.warn(`Error emitting comment.created: ${e}`);
    }
  }

  @SubscribeMessage('joinPost')
  handleJoinPost(client: Socket, payload: { postId: string }) {
      if (!client.data?.user || !client.data.user._id) {
      void client.emit('error', { message: 'Unauthorized' });
      return;
    }
      if (!payload || !payload.postId) {
      void client.emit('error', { message: 'Missing postId' });
      return;
    }
    const room = `post:${payload.postId}`;
    // Avoid duplicate joins/log spam if client already in the room
    try {
      const alreadyIn = client.rooms && client.rooms.has && client.rooms.has(room);
      if (!alreadyIn) {
        client.join(room);
        this.logger.log(`Socket ${client.id} joined post room ${room}`);
      } else {
        this.logger.debug(`Socket ${client.id} already in post room ${room}`);
      }
    } catch (err) {
      // conservative join in case of unexpected socket structure
      try { client.join(room) } catch(_){}
      this.logger.log(`Socket ${client.id} joined post room ${room}`);
    }
  }
}
