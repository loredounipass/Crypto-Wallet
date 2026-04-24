import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import type { MessageCreatedEvent } from './events/message-created.event';
import { Server, Socket } from 'socket.io';
// DTOs are used by controllers/services; gateway only emits socket events on domain events

import * as connectRedis from 'connect-redis';
import Redis from 'ioredis';
import * as session from 'express-session';

@WebSocketGateway({ namespace: '/messages', cors: { origin: ['https://orange-spoon-5j4gqrq49prf7j6r-3000.app.github.dev'], credentials: true } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('MessagesGateway');

  // reuse Redis session store to validate session on handshake
  private redisStore: any;

  constructor() {
    const RedisStore = connectRedis.default || connectRedis;
    const RedisStoreClass = RedisStore(session);
    const redisClient = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') });
    this.redisStore = new RedisStoreClass({ client: redisClient as any });
  }

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

      // express-session stores the session id raw (not prefixed). If cookie was URL-encoded, decode it.
      let sid = rawSid;
      if (sid.startsWith('s:')) {
        sid = sid.slice(2).split('.')[0];
      }

      // retrieve session from Redis store (awaited)
      const sess = await this.getSession(sid);
      if (!sess) {
        this.logger.warn(`Session not found for socket ${client.id}`);
        void client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      const passportUser = sess.passport && sess.passport.user ? sess.passport.user : null;
      if (!passportUser) {
        this.logger.warn(`No passport user in session for socket ${client.id}`);
        void client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      // store sanitized user payload on socket
      client.data.user = passportUser;
      // assume passportUser has _id present and is a valid ObjectId string
      const userId = passportUser._id.toString();
      client.join(`user:${userId}`);
      this.logger.log(`Socket ${client.id} authenticated and joined user:${userId}`);
    } catch (e) {
      this.logger.error(`Error during socket auth for ${client.id}: ${e}`);
      void client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  private getSession(sid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.redisStore.get(sid, (err: any, sess: any) => {
        if (err) return reject(err);
        resolve(sess);
      });
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private makeChatRoom(a: string, b: string) {
    return `chat:${[a, b].sort().join('-')}`;
  }

  // No business logic in gateway: listen domain events and emit sockets
  @OnEvent('message.created')
  async handleMessageCreatedEvent(payload: MessageCreatedEvent) {
    try {
      const senderId = payload.sender;
      const receiverId = payload.receiver;
      if (!senderId || !receiverId) return;

      const room = this.makeChatRoom(senderId, receiverId);
      // gather unique socket ids for targets to avoid duplicate emits
      const roomSockets = await this.server.in(room).allSockets();
      const receiverSockets = await this.server.in(`user:${receiverId}`).allSockets();
      const senderSockets = await this.server.in(`user:${senderId}`).allSockets();

      const receiveTargets = new Set<string>([...roomSockets, ...receiverSockets]);
      // emit 'receiveMessage' once per unique socket
      for (const sockId of receiveTargets) {
        void this.server.to(sockId).emit('receiveMessage', payload);
      }

      // emit 'messageSent' to sender sockets (unique)
      for (const sockId of senderSockets) {
        void this.server.to(sockId).emit('messageSent', payload);
      }
    } catch (err) {
      this.logger.warn(`Error emitting message.created event: ${err}`);
    }
  }

  @OnEvent('message.updated')
  async handleMessageUpdatedEvent(payload: any) {
    try {
      const senderId = payload.sender;
      const receiverId = payload.receiver;
      if (!senderId || !receiverId) return;

      const room = this.makeChatRoom(senderId, receiverId);
      const roomSockets = await this.server.in(room).allSockets();
      const receiverSockets = await this.server.in(`user:${receiverId}`).allSockets();
      const senderSockets = await this.server.in(`user:${senderId}`).allSockets();

      const receiveTargets = new Set<string>([...roomSockets, ...receiverSockets]);
      for (const sockId of receiveTargets) {
        void this.server.to(sockId).emit('messageUpdated', payload);
      }

      for (const sockId of senderSockets) {
        void this.server.to(sockId).emit('messageUpdated', payload);
      }
    } catch (err) {
      this.logger.warn(`Error emitting message.updated event: ${err}`);
    }
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(client: Socket, payload: { otherUserId: string }) {
    if (!client.data?.user || !client.data.user._id) {
      void client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const senderId = client.data.user._id.toString();
    if (!senderId) {
      void client.emit('error', { message: 'Unauthorized' });
      return;
    }

    if (!payload || !payload.otherUserId) {
      void client.emit('error', { message: 'Missing otherUserId' });
      return;
    }

    const room = this.makeChatRoom(senderId, payload.otherUserId);
    client.join(room);
    this.logger.log(`Socket ${client.id} joined chat room ${room}`);
  }
}
