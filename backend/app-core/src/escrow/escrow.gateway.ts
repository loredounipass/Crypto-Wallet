import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as connectRedis from 'connect-redis';
import Redis from 'ioredis';
import * as session from 'express-session';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EscrowOrder, EscrowOrderDocument } from './schemas/escrow-order.schema';

type EscrowStatusEvent = {
  orderId: string;
  status: string;
  sellerEmail?: string;
  providerEmail?: string;
  disputeReason?: string;
  disputeOpenedBy?: string;
};

@WebSocketGateway({
  namespace: '/escrow',
  cors: { origin: ['https://upgraded-halibut-qj97q4q9prr299vp-3000.app.github.dev'], credentials: true },
})
export class EscrowGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('EscrowGateway');
  private readonly redisStore: any;

  constructor(
    @InjectModel(EscrowOrder.name) private escrowOrderModel: Model<EscrowOrderDocument>
  ) {
    const RedisStore = connectRedis.default || connectRedis;
    const RedisStoreClass = RedisStore(session);
    const redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    this.redisStore = new RedisStoreClass({ client: redisClient as any });
  }

  private parseCookies(cookieHeader: string | undefined) {
    const rc = cookieHeader || '';
    return rc
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .reduce((acc: any, item) => {
        const idx = item.indexOf('=');
        if (idx > -1) {
          const k = item.substring(0, idx);
          const v = item.substring(idx + 1);
          acc[k] = decodeURIComponent(v);
        }
        return acc;
      }, {});
  }

  private getSession(sid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.redisStore.get(sid, (err: any, sess: any) => {
        if (err) return reject(err);
        resolve(sess);
      });
    });
  }

  async handleConnection(client: Socket) {
    try {
      const cookies = this.parseCookies(
        client.handshake.headers.cookie as string | undefined,
      );
      const rawSid = cookies['connect.sid'] || cookies['sid'] || null;
      if (!rawSid) {
        void client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      let sid = rawSid;
      if (sid.startsWith('s:')) {
        sid = sid.slice(2).split('.')[0];
      }

      const sess = await this.getSession(sid);
      const passportUser = sess?.passport?.user;
      if (!passportUser?.email) {
        void client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      client.data.user = passportUser;
      const userEmail = passportUser.email;
      client.join(`escrow:user:${userEmail}`);
      this.logger.log(`Socket ${client.id} joined escrow:user:${userEmail}`);
    } catch (error) {
      this.logger.warn(`Socket auth failed for ${client.id}: ${error}`);
      void client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Escrow client disconnected: ${client.id}`);
  }

  @SubscribeMessage('watchOrder')
  async handleWatchOrder(client: Socket, payload: { orderId: string }) {
    const userEmail = client.data?.user?.email;
    if (!userEmail) {
      void client.emit('error', { message: 'Unauthorized' });
      return;
    }
    if (!payload?.orderId) {
      void client.emit('error', { message: 'Missing orderId' });
      return;
    }

    try {
      const order = await this.escrowOrderModel.findOne({ orderId: payload.orderId });
      if (!order) {
        void client.emit('error', { message: 'Order not found' });
        return;
      }

      if (order.sellerEmail !== userEmail && order.providerEmail !== userEmail) {
        void client.emit('error', { message: 'Forbidden' });
        return;
      }

      client.join(`escrow:order:${payload.orderId}`);
    } catch (error) {
      this.logger.error(`Error in watchOrder: ${error}`);
      void client.emit('error', { message: 'Internal server error' });
    }
  }

  emitEscrowStatusUpdate(event: EscrowStatusEvent) {
    if (!event?.orderId) return;

    // Emit to the order room
    this.server
      .to(`escrow:order:${event.orderId}`)
      .emit('escrowStatusUpdated', event);

    // Emit to both the seller's and provider's user rooms
    if (event.sellerEmail) {
      this.server
        .to(`escrow:user:${event.sellerEmail}`)
        .emit('escrowStatusUpdated', event);
    }
    if (event.providerEmail) {
      this.server
        .to(`escrow:user:${event.providerEmail}`)
        .emit('escrowStatusUpdated', event);
    }
  }
}
