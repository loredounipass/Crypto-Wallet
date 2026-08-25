import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';
import { Types } from 'mongoose';
import { Multimedia, MultimediaDocument } from './schemas/multimedia.schema';
import { MessageRepository } from 'src/repositories/message.repository';
import { MultimediaRepository } from 'src/repositories/multimedia.repository';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserService } from 'src/user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { MessageCreatedEvent } from './events/message-created.event';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { LocalStorageProvider } from 'src/storage/local.storage.provider';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Injectable()
export class MessagesAndMultimediaService implements OnModuleInit {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly multimediaRepository: MultimediaRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('multimedia') private readonly multimediaQueue: Queue,
    private readonly storage: LocalStorageProvider,
  ) { }



  // ESCUCHA LOS EVENTOS DEL PROCESAMIENTO MULTIMEDIA PARA ACTUALIZAR EL ESTADO DEL MENSAJE EN TIEMPO REAL
  onModuleInit() {
    try {
      this.eventEmitter.on('multimedia.ready', async (payload: any) => {
        try {
          if (payload?.messageId) {
            const updated = await this.messageRepository.findByIdAndUpdate(payload.messageId, {
              multimediaStatus: 'ready',
            }, { returnDocument: 'after' });
            if (updated) {
              const updatedDoc: any = (updated as any).value ?? updated;
              const out = {
                _id: updatedDoc._id?.toString(),
                content: updatedDoc.content,
                type: updatedDoc.type,
                sender: updatedDoc.sender?.toString(),
                receiver: updatedDoc.receiver?.toString(),
                multimediaId: updatedDoc.multimediaId,
                multimediaStatus: updatedDoc.multimediaStatus,
                multimediaUrl: payload.url,
                thumbnailUrl: payload.thumbnailUrl,
                duration: payload.metadata?.duration,
                status: updatedDoc.status,
                createdAt: (updatedDoc as any).createdAt,
                updatedAt: (updatedDoc as any).updatedAt,
              };
              void this.eventEmitter.emit('message.updated', out);
            }
          }
        } catch (_) { }
      });
      this.eventEmitter.on('multimedia.failed', async (payload: any) => {
        try {
          if (payload?.messageId) {
            const updated = await this.messageRepository.findByIdAndUpdate(payload.messageId, {
              multimediaStatus: 'ready',
              duration: payload.metadata?.duration,
            }, { returnDocument: 'after' });
            if (updated) {
              const updatedDoc: any = (updated as any).value ?? updated;
              const out = {
                _id: updatedDoc._id?.toString(),
                content: updatedDoc.content,
                type: updatedDoc.type,
                sender: updatedDoc.sender?.toString(),
                receiver: updatedDoc.receiver?.toString(),
                multimediaId: updatedDoc.multimediaId,
                multimediaStatus: updatedDoc.multimediaStatus,
                multimediaUrl: payload.url || null,
                status: updatedDoc.status,
                createdAt: (updatedDoc as any).createdAt,
                updatedAt: (updatedDoc as any).updatedAt,
              };
              void this.eventEmitter.emit('message.updated', out);
            }
          }
        } catch (_) { }
      });
    } catch (_) { }
  }



  // CREA Y GUARDA EN BASE DE DATOS UN NUEVO MENSAJE DE TEXTO ENTRE DOS USUARIOS VERIFICANDO SU EXISTENCIA
  async createMessage(dto: CreateMessageDto, senderId: string) {
    if (!senderId || !Types.ObjectId.isValid(senderId)) {
      throw new BadRequestException('Invalid senderId');
    }
    if (!dto.receiverId || !Types.ObjectId.isValid(dto.receiverId)) {
      throw new BadRequestException('Invalid receiverId');
    }
    const receiverExists = await this.userService.getUserById(dto.receiverId);
    if (!receiverExists) throw new NotFoundException('Receiver not found');
    const created = await this.messageRepository.create({
      content: dto.content,
      type: dto.type,
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(dto.receiverId),
      multimediaId: dto.multimediaId ? new Types.ObjectId(dto.multimediaId) : undefined,
    });
    const createdObj: any = typeof (created.toObject) === 'function' ? created.toObject() : created;
    const payload = {
      _id: createdObj._id?.toString(),
      content: createdObj.content,
      type: createdObj.type,
      sender: createdObj.sender?.toString(),
      receiver: createdObj.receiver?.toString(),
      multimediaUrl: createdObj.multimediaUrl,
      status: 'sent' as const,
      createdAt: createdObj.createdAt,
      updatedAt: createdObj.updatedAt,
    };
    void this.eventEmitter.emit('message.created', payload as MessageCreatedEvent);
    return payload;
  }



  // RECUPERA Y COMBINA TODOS LOS MENSAJES ENVIADOS Y RECIBIDOS POR EL USUARIO ORDENADOS POR FECHA
  async getMessagesByUser(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }
    const id = new Types.ObjectId(userId);
    const [sentDocs, receivedDocs] = await Promise.all([
      this.messageRepository.find({ sender: id })
        .select('_id content type sender receiver multimediaId multimediaStatus status duration createdAt updatedAt')
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.messageRepository.find({ receiver: id })
        .select('_id content type sender receiver multimediaId multimediaStatus status duration createdAt updatedAt')
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
    ]) as any[][];
    const map = new Map<string, any>();
    for (const d of sentDocs) map.set(d._id.toString(), d);
    for (const d of receivedDocs) map.set(d._id.toString(), d);
    const merged = Array.from(map.values()).sort((a: any, b: any) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });
    const multimediaIds = merged.filter((d: any) => d.multimediaId).map((d: any) => d.multimediaId.toString());
    const multimediaMap: Map<string, any> = new Map();
    if (multimediaIds.length > 0) {
      const uniq = Array.from(new Set(multimediaIds));
      const mDocs = await this.multimediaRepository.find({ _id: { $in: uniq } }).select('_id url thumbnailUrl status duration').lean().exec() as any[];
      for (const m of mDocs) multimediaMap.set(m._id?.toString(), m);
    }
    return merged.map((doc: any) => ({
      _id: doc._id,
      content: doc.content,
      type: doc.type,
      sender: doc.sender?.toString(),
      receiver: doc.receiver?.toString(),
      multimediaId: doc.multimediaId,
      multimediaStatus: doc.multimediaStatus || (multimediaMap.get(doc.multimediaId?.toString())?.status || null),
      multimediaUrl: multimediaMap.get(doc.multimediaId?.toString())?.url || undefined,
      thumbnailUrl: multimediaMap.get(doc.multimediaId?.toString())?.thumbnailUrl || undefined,
      duration: multimediaMap.get(doc.multimediaId?.toString())?.duration || doc.duration || undefined,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }



  // REGISTRA UN NUEVO ARCHIVO MULTIMEDIA EN LA BASE DE DATOS Y LO ASOCIA A UN USUARIO ESPECIFICO
  async saveMultimedia(data: { url: string; type: string; ownerId: string; description?: string; messageId?: string }) {
    const owner = new Types.ObjectId(data.ownerId);
    const message = data.messageId ? new Types.ObjectId(data.messageId) : undefined;
    const created = await this.multimediaRepository.create({
      url: data.url,
      type: data.type,
      owner,
      description: data.description,
      message,
    });
    return this.multimediaRepository.findById(created._id);
  }



  // ALMACENA TEMPORALMENTE UN ARCHIVO ADJUNTO CREA LOS REGISTROS Y ENCOLA EL TRABAJO DE PROCESAMIENTO
  async createMessageWithFile(file: MulterFile, dto: CreateMessageDto, senderId: string) {
    if (!file) throw new BadRequestException('File is required');
    if (file.mimetype?.startsWith('video/')) {
      throw new BadRequestException('Video processing is disabled');
    }
    if (!senderId || !Types.ObjectId.isValid(senderId)) {
      throw new BadRequestException('Invalid senderId');
    }
    if (!dto.receiverId || !Types.ObjectId.isValid(dto.receiverId)) {
      throw new BadRequestException('Invalid receiverId');
    }
    const receiverExists = await this.userService.getUserById(dto.receiverId);
    if (!receiverExists) throw new NotFoundException('Receiver not found');
    const ext = file.originalname ? path.extname(file.originalname).toLowerCase() : '';
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.pdf', '.webm', '.ogg'];
    const safeExt = allowedExts.includes(ext) ? ext : '.bin';
    const stagingKey = `staging/${crypto.randomUUID()}${safeExt}`;
    const uploadResult = await this.storage.upload(file.buffer, stagingKey, file.mimetype);
    console.log(`[MessagesService] 📤 File uploaded to staging | key=${stagingKey} | url=${uploadResult.url} | size=${uploadResult.size}`);
    const multimediaDoc = await this.multimediaRepository.create({
      url: uploadResult.url,
      type: dto.type,
      owner: new Types.ObjectId(senderId),
      description: dto.content || undefined,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      status: 'uploading',
    });
    console.log(`[MessagesService] 📄 Multimedia doc created | id=${multimediaDoc._id} | type=${dto.type} | mimeType=${uploadResult.mimeType}`);
    const messageDoc = await this.messageRepository.create({
      content: dto.content,
      type: dto.type,
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(dto.receiverId),
      multimediaId: multimediaDoc._id,
      multimediaStatus: 'processing',
    });
    await this.multimediaRepository.updateOne({ _id: multimediaDoc._id }, {
      $set: { message: messageDoc._id, status: 'processing', url: uploadResult.url }
    }).exec();
    console.log(`[MessagesService] 📝 Message created & multimedia linked | messageId=${messageDoc._id} | multimediaId=${multimediaDoc._id}`);
    await this.multimediaQueue.add('process', {
      stagingKey: uploadResult.key,
      multimediaId: multimediaDoc._id.toString(),
      messageId: messageDoc._id.toString(),
      ownerId: senderId,
      mimeType: file.mimetype,
    });
    console.log(`[MessagesService] 📨 Job enqueued to 'multimedia' queue | stagingKey=${stagingKey} | multimediaId=${multimediaDoc._id} | messageId=${messageDoc._id}`);
    const payload = {
      _id: messageDoc._id?.toString(),
      content: messageDoc.content,
      type: messageDoc.type,
      sender: messageDoc.sender?.toString(),
      receiver: messageDoc.receiver?.toString(),
      multimediaId: messageDoc.multimediaId,
      multimediaStatus: (messageDoc as any).multimediaStatus || null,
      status: 'sent' as const,
      createdAt: (messageDoc as any).createdAt,
      updatedAt: (messageDoc as any).updatedAt,
    };
    void this.eventEmitter.emit('message.created', payload as MessageCreatedEvent);
    return payload;
  }
}
