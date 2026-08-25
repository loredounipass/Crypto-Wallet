import { Logger, Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import type { MessageCreatedEvent } from './events/message-created.event';
import { Server, Socket } from 'socket.io';
import { REDIS_CLIENT } from '../redis/redis.module';

@WebSocketGateway({ namespace: '/messages', cors: { origin: [process.env.CORS_ORIGIN], credentials: true } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('MessagesGateway');

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: any,
  ) {}



  // EXTRAE Y DECODIFICA LAS COOKIES DE LA CABECERA HTTP PARA IDENTIFICAR LA SESION DEL CLIENTE
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



  // VERIFICA LA AUTENTICACION DEL USUARIO AL CONECTARSE AL SOCKET Y LO ASIGNA A SU SALA PERSONAL
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
      if (sid.startsWith('s:')) {
        sid = sid.slice(2).split('.')[0];
      }
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



  // BUSCA Y RECUPERA LOS DATOS DE LA SESION DEL USUARIO ALMACENADOS PREVIAMENTE EN REDIS
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



  // REGISTRA LA DESCONEXION DE UN CLIENTE DEL SERVIDOR DE WEBSOCKETS
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }



  // GENERA UN IDENTIFICADOR UNICO Y CONSISTENTE PARA LA SALA DE CHAT ENTRE DOS USUARIOS CUALESQUIERA
  private makeChatRoom(a: string, b: string) {
    return `chat:${[a, b].sort().join('-')}`;
  }



  // NOTIFICA A LOS DISPOSITIVOS DE AMBOS USUARIOS SOBRE LA CREACION DE UN NUEVO MENSAJE PARA ACTUALIZAR SUS PANTALLAS
  @OnEvent('message.created')
  async handleMessageCreatedEvent(payload: MessageCreatedEvent) {
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
        void this.server.to(sockId).emit('receiveMessage', payload);
      }
      for (const sockId of senderSockets) {
        void this.server.to(sockId).emit('messageSent', payload);
      }
    } catch (err) {
      this.logger.warn(`Error emitting message.created event: ${err}`);
    }
  }



  // DIFUNDE LAS ACTUALIZACIONES DE UN MENSAJE COMO EL CAMBIO DE ESTADO O LA CARGA MULTIMEDIA A LOS INVOLUCRADOS
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



  // SUSCRIBE LA CONEXION DEL USUARIO A UNA SALA DE CHAT ESPECIFICA PARA RECIBIR SUS EVENTOS EN TIEMPO REAL
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



  // EMITE UN EVENTO HACIA EL RECEPTOR INDICANDO SI LA OTRA PERSONA ESTA ESCRIBIENDO UN MENSAJE EN ESE MOMENTO
  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { receiverId: string, isTyping: boolean }) {
    if (!client.data?.user || !client.data.user._id) return;
    const senderId = client.data.user._id.toString();
    const receiverId = payload?.receiverId;
    if (!receiverId) return;
    this.logger.log(`Typing event: ${senderId} -> ${receiverId} | isTyping=${payload.isTyping}`);
    const typingPayload = { senderId, isTyping: !!payload.isTyping };
    const room = this.makeChatRoom(senderId, receiverId);
    void client.to(room).emit('typing', typingPayload);
    void this.server.to(`user:${receiverId}`).emit('typing', typingPayload);
  }
}
