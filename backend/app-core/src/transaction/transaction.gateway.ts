import { Logger, Inject } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

type TransactionStatusEvent = {
  transactionId: string;
  status?: number;
  confirmations?: number;
  txHash?: string;
};

@WebSocketGateway({
  namespace: '/transactions',
  cors: { origin: [process.env.CORS_ORIGIN], credentials: true },
})
export class TransactionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('TransactionGateway');

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: any,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

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

  private async getSession(sid: string): Promise<any> {
    const data = await this.redisClient.get(`sess:${sid}`);
    return data ? JSON.parse(data) : null;
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
      if (!passportUser?._id) {
        void client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      client.data.user = passportUser;
      const userId = passportUser._id.toString();
      client.join(`user:${userId}`);
      this.logger.log(`Socket ${client.id} joined user:${userId}`);
    } catch (error) {
      this.logger.warn(`Socket auth failed for ${client.id}: ${error}`);
      void client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('watchTransaction')
  handleWatchTransaction(client: Socket, payload: { transactionId: string }) {
    if (!client.data?.user?._id) {
      void client.emit('error', { message: 'Unauthorized' });
      return;
    }
    if (!payload?.transactionId) {
      void client.emit('error', { message: 'Missing transactionId' });
      return;
    }
    client.join(`tx:${payload.transactionId}`);
  }

  async emitTransactionStatus(event: TransactionStatusEvent) {
    try {
      if (!event?.transactionId) return;
      const transactionObjectId = new Types.ObjectId(event.transactionId);
      const [transaction, wallet] = await Promise.all([
        this.transactionModel
          .findById(transactionObjectId, {
            _id: 1,
            txHash: 1,
            status: 1,
            confirmations: 1,
            created_at: 1,
            nature: 1,
            amount: 1,
            fee: 1,
            to: 1,
          })
          .lean(),
        this.walletModel.findOne(
          { transactions: transactionObjectId } as any,
          { _id: 1, coin: 1, chainId: 1 },
        ).lean(),
      ]);

      if (!transaction || !wallet?._id) return;

      const user = await this.userModel
        .findOne({ wallets: wallet._id }, { _id: 1 })
        .lean();
      if (!user?._id) return;

      const payload = {
        transactionId: transaction._id.toString(),
        txHash: transaction.txHash,
        status: event.status ?? transaction.status,
        confirmations: event.confirmations ?? transaction.confirmations ?? 0,
        created_at: (transaction as any).created_at,
        nature: transaction.nature,
        amount: transaction.amount,
        fee: (transaction as any).fee || 0,
        to: transaction.to,
        coin: wallet.coin,
        chainId: wallet.chainId,
      };

      const userRoom = `user:${user._id.toString()}`;
      this.server.to(userRoom).emit('transactionStatusUpdated', payload);
      this.server.to(`tx:${payload.transactionId}`).emit('transactionStatusUpdated', payload);
    } catch (error) {
      this.logger.warn(`Failed to emit transaction status update: ${error}`);
    }
  }
}
