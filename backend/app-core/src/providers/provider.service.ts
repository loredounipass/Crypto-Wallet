import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { Chat, ChatDocument } from './schemas/chat-schema/chat.schema';
import { Message, MessageDocument } from './schemas/chat-schema/message.schema';
import { CreateChatDto } from './dto/chat.dto';
import { CreateProviderDto } from './dto/provider.dto';  
import { CreateMessageDto } from './dto/message.dto';  
import { v4 as uuidv4 } from 'uuid';  

@Injectable()
export class ProviderService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,

    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,

    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  
  async createProvider(createProviderDto: CreateProviderDto): Promise<Provider> {
    const { email, idNumber } = createProviderDto;
    const existing = await this.providerModel.findOne({
      $or: [{ email }, { idNumber }],
    });
    if (existing) {
      throw new BadRequestException('Provider with this email or ID number already exists.');
    }
    const newProvider = new this.providerModel(createProviderDto);
    return newProvider.save();
  }

  

  async findAllProviders(): Promise<Provider[]> {
    return this.providerModel.find({ isValid: true }).exec();
  }


  async findProviderByEmail(email: string): Promise<Provider> {
    return this.providerModel.findOne({ email }).exec();
  }


  async createChat(createChatDto: CreateChatDto): Promise<Chat> {
    const { chatName, users, latestMessage } = createChatDto;
    const chatroomId = uuidv4();
    const newChat = new this.chatModel({
      chatName,
      users,
      chatroomId,  
      latestMessage: latestMessage || null,
    });
    await newChat.save();
    return { 
      ...newChat.toObject(),
      chatroomId,  
    };
  }


  async sendMessageAsUser(createMessageDto: CreateMessageDto): Promise<Chat> {
  const { sender, message, chatroomId } = createMessageDto;

  const chat = await this.chatModel.findOne({ chatroomId });
  if (!chat) {
    throw new BadRequestException('Chat not found.');
  }

  if (!chat.users.includes(sender)) {
    throw new BadRequestException('User is not part of this chat.');
  }

  const newMessage = new this.messageModel({
    sender,
    message,
    chatId: chatroomId,
    hash: uuidv4(),
  });

  await newMessage.save();
  chat.latestMessage = message;
  await chat.save();

  return chat;
}


  async sendMessageAsProvider(createMessageDto: CreateMessageDto): Promise<Chat> {
  const { sender, message, chatroomId } = createMessageDto;

  const chat = await this.chatModel.findOne({ chatroomId });
  if (!chat) {
    throw new BadRequestException('Chat not found.');
  }

  const provider = await this.providerModel.findOne({ email: sender });
  if (!provider) {
    throw new BadRequestException('Provider not found.');
  }

  const newMessage = new this.messageModel({
    sender,
    message,
    chatId: chatroomId,
    hash: uuidv4(),
  });

  await newMessage.save();

  chat.latestMessage = message;
  await chat.save();

  return chat;
}



  async updateProvider(email: string, updateData: { paymentMethods?: string[]; walletAddress?: string }): Promise<Provider> {
    const provider = await this.providerModel.findOne({ email });
    if (!provider) {
      throw new BadRequestException('Provider not found.');
    }
    if (updateData.paymentMethods !== undefined) {
      provider.paymentMethods = updateData.paymentMethods;
    }
    if (updateData.walletAddress !== undefined) {
      provider.walletAddress = updateData.walletAddress;
    }
    return provider.save();
  }


  async getMessages(chatroomId: string): Promise<any> {
  const chat = await this.chatModel.findOne({ chatroomId }).exec();
  if (!chat) {
    throw new BadRequestException('Chat not found.');
  }

  const messages = await this.messageModel
    .find({ chatId: chat.chatroomId })
    .sort({ timeStamp: 1 })
    .exec();

  return {
    chatroomId: chat.chatroomId,
    chatName: chat.chatName,
    users: chat.users,
    messages: messages.map((message) => ({
      sender: message.sender,
      message: message.message,
      timeStamp: message.timeStamp,
    })),
  };
}

  
}
