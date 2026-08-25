import { Logger, Inject } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REDIS_CLIENT } from '../redis/redis.module';
import { EscrowOrder, EscrowOrderDocument } from './schemas/escrow-order.schema';

type EscrowStatusEvent = {
  orderId: string;
  status: string;
  sellerEmail?: string;
  providerEmail?: string;
  disputeReason?: string;
  disputeOpenedBy?: string;
  resolutionType?: string;
};

@WebSocketGateway({
  namespace: '/escrow',
  cors: { origin: [process.env.CORS_ORIGIN], credentials: true },
})
export class EscrowGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('EscrowGateway');

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: any,
    @InjectModel(EscrowOrder.name) private escrowOrderModel: Model<EscrowOrderDocument>
  ) {}



  // EXTRAE Y FORMATEA LAS COOKIES DEL ENCABEZADO DE LA PETICION PARA BUSCAR LA SESION DEL USUARIO
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



  // CONSULTA EL ALMACENAMIENTO DE REDIS PARA RECUPERAR LOS DATOS DE SESION ASOCIADOS AL IDENTIFICADOR PROPORCIONADO
  private async getSession(sid: string): Promise<any> {
    const data = await this.redisClient.get(`sess:${sid}`);
    return data ? JSON.parse(data) : null;
  }



  // VERIFICA LA AUTENTICACION DEL USUARIO AL CONECTARSE Y LO SUSCRIBE A SU SALA PRIVADA DE NOTIFICACIONES
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



  // REGISTRA EN LOS LOGS DEL SISTEMA CADA VEZ QUE UN USUARIO CIERRA SU CONEXION DE WEBSOCKET
  handleDisconnect(client: Socket) {
    this.logger.log(`Escrow client disconnected: ${client.id}`);
  }



  // PERMITE AL USUARIO SUSCRIBIRSE PARA RECIBIR ACTUALIZACIONES EN TIEMPO REAL SOBRE UNA ORDEN ESPECIFICA
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



  // DISTRIBUYE LOS EVENTOS DE CAMBIO DE ESTADO TANTO A LA SALA DE LA ORDEN COMO A LOS USUARIOS INVOLUCRADOS
  emitEscrowStatusUpdate(event: EscrowStatusEvent) {
    if (!event?.orderId) return;
    void this.server
      .to(`escrow:order:${event.orderId}`)
      .emit('escrowStatusUpdated', event);
    if (event.sellerEmail) {
      void this.server
        .to(`escrow:user:${event.sellerEmail}`)
        .emit('escrowStatusUpdated', event);
    }
    if (event.providerEmail) {
      void this.server
        .to(`escrow:user:${event.providerEmail}`)
        .emit('escrowStatusUpdated', event);
    }
  }
}
