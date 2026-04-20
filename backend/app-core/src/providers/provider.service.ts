import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { Chat, ChatDocument } from './schemas/chat-schema/chat.schema';
import { Message, MessageDocument } from './schemas/chat-schema/message.schema';
import { CreateChatDto } from './dto/chat.dto';
import { CreateProviderDto } from './dto/provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
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


  async updateProvider(
    email: string,
    updateProviderDto: UpdateProviderDto
  ): Promise<Provider> {
    const provider = await this.providerModel.findOne({ email });
    if (!provider) {
      throw new BadRequestException('Provider not found.');
    }
    if (updateProviderDto.paymentMethods !== undefined) {
      provider.paymentMethods = updateProviderDto.paymentMethods;
    }
    if (updateProviderDto.walletAddress !== undefined) {
      provider.walletAddress = updateProviderDto.walletAddress;
    }
    return provider.save();
  }

  
}
