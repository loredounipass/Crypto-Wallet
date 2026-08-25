import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { ProviderTerms, ProviderTermsDocument } from './provider-terms.schema';
import { Chat, ChatDocument } from './schemas/chat-schema/chat.schema';
import { Message, MessageDocument } from './schemas/chat-schema/message.schema';
import { CreateChatDto } from './dto/chat.dto';
import { CreateProviderDto } from './dto/provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { CreateMessageDto } from './dto/message.dto';  
import { AddPaymentMethodDto, UpdateDestinationWalletDto, ToggleDestinationWalletDto } from './dto/provider-settings.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { v4 as uuidv4 } from 'uuid';  

@Injectable()
export class ProviderService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,

    @InjectModel(ProviderTerms.name)
    private readonly providerTermsModel: Model<ProviderTermsDocument>,

    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,

    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
  ) {}



  // VERIFICA QUE EL CORREO O DOCUMENTO NO EXISTAN ANTES DE CREAR UN NUEVO REGISTRO INACTIVO DE PROVEEDOR
  async createProvider(createProviderDto: CreateProviderDto): Promise<Provider> {
    const { email, idNumber } = createProviderDto;
    const existing = await this.providerModel.findOne({
      $or: [{ email }, { idNumber }],
    });
    if (existing) {
      throw new BadRequestException('Provider with this email or ID number already exists.');
    }
    const newProvider = new this.providerModel({
      ...createProviderDto,
      isValid: false,
    });
    return newProvider.save();
  }



  // CONSULTA LA BASE DE DATOS PARA OBTENER TODOS LOS PROVEEDORES VALIDADOS EXCLUYENDO AL USUARIO ACTUAL
  async findAllProviders(currentUserEmail?: string): Promise<Provider[]> {
    const filter: any = { isValid: true };
    if (currentUserEmail) {
      filter.email = { $ne: currentUserEmail };
    }
    return await this.providerModel.find(filter).exec();
  }



  // CREA O ACTUALIZA EL REGISTRO DE TERMINOS Y CONDICIONES ESTABLECIENDO SU ESTADO COMO ACEPTADO
  async acceptTerms(email: string): Promise<ProviderTerms> {
    const existing = await this.providerTermsModel.findOne({ email }).exec();
    if (existing) {
      existing.accepted = true;
      return existing.save();
    }
    const newTerms = new this.providerTermsModel({ email, accepted: true });
    return newTerms.save();
  }



  // BUSCA EL REGISTRO DEL USUARIO PARA COMPROBAR SI YA ACEPTO LOS TERMINOS Y CONDICIONES PREVIAMENTE
  async checkTerms(email: string): Promise<boolean> {
    const terms = await this.providerTermsModel.findOne({ email }).exec();
    return terms ? terms.accepted : false;
  }



  // RETORNA LA INFORMACION COMPLETA DEL PROVEEDOR A PARTIR DE SU CORREO ELECTRONICO EXACTO
  async findProviderByEmail(email: string): Promise<Provider> {
    return await this.providerModel.findOne({ email }).exec();
  }



  // MODIFICA LAS LISTAS DE METODOS DE PAGO Y BILLETERAS DE DESTINO EN EL PERFIL DEL PROVEEDOR
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
    if (updateProviderDto.destinationWallets !== undefined) {
      provider.destinationWallets = updateProviderDto.destinationWallets;
    }
    return provider.save();
  }



  // RECUPERA EL DOCUMENTO DEL PROVEEDOR PARA OBTENER TODAS SUS CONFIGURACIONES ALMACENADAS
  async getProviderSettings(email: string): Promise<Provider> {
    const provider = await this.providerModel.findOne({ email }).exec();
    if (!provider) {
      throw new NotFoundException('Provider not found.');
    }
    return provider;
  }



  // INSERTA UN NUEVO METODO DE PAGO A LA LISTA EXISTENTE SI ES QUE AUN NO HA SIDO REGISTRADO
  async addPaymentMethod(
    email: string,
    dto: AddPaymentMethodDto
  ): Promise<Provider> {
    const provider = await this.providerModel.findOne({ email });
    if (!provider) {
      throw new NotFoundException('Provider not found.');
    }
    if (!provider.paymentMethods.includes(dto.paymentMethod)) {
      provider.paymentMethods.push(dto.paymentMethod);
    }
    return provider.save();
  }



  // ELIMINA DE LA LISTA EL METODO DE PAGO INDICADO MEDIANTE UN FILTRO Y GUARDA LOS CAMBIOS
  async deletePaymentMethod(email: string, method: string): Promise<Provider> {
    const provider = await this.providerModel.findOne({ email });
    if (!provider) {
      throw new NotFoundException('Provider not found.');
    }
    provider.paymentMethods = provider.paymentMethods.filter(
      (pm) => pm !== method
    );
    return provider.save();
  }



  // ACTUALIZA LA CONFIGURACION DE UNA BILLETERA O LA AGREGA A LA LISTA SI NO EXISTIA PREVIAMENTE
  async updateDestinationWallet(
    email: string,
    dto: UpdateDestinationWalletDto
  ): Promise<Provider> {
    const provider = await this.providerModel.findOne({ email });
    if (!provider) {
      throw new NotFoundException('Provider not found.');
    }
    const existingIndex = provider.destinationWallets.findIndex(
      (w) => w.coin === dto.coin && w.chainId === dto.chainId
    );
    if (existingIndex >= 0) {
      provider.destinationWallets[existingIndex] = {
        address: dto.address,
        coin: dto.coin,
        chainId: dto.chainId,
        enabled: dto.enabled ?? true,
      };
    } else {
      provider.destinationWallets.push({
        address: dto.address,
        coin: dto.coin,
        chainId: dto.chainId,
        enabled: dto.enabled ?? true,
      });
    }
    return provider.save();
  }



  // INVIERTE EL ESTADO DE ACTIVACION DE UNA BILLETERA EXISTENTE O LA REGISTRA COMO ACTIVA POR DEFECTO
  async toggleDestinationWallet(
    email: string,
    dto: ToggleDestinationWalletDto
  ): Promise<Provider> {
    const user = await this.userModel.findOne({ email }).populate('wallets').exec();
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const wallet = (user.wallets as any).find(
      (w: any) => w.address === dto.address
    );
    if (!wallet) {
      throw new BadRequestException('Wallet not found or does not belong to this user.');
    }
    const provider = await this.providerModel.findOne({ email });
    if (!provider) {
      throw new NotFoundException('Provider not found.');
    }
    const existingIndex = provider.destinationWallets.findIndex(
      (w) => w.address === dto.address
    );
    if (existingIndex >= 0) {
      provider.destinationWallets[existingIndex].enabled =
        !provider.destinationWallets[existingIndex].enabled;
    } else {
      provider.destinationWallets.push({
        address: wallet.address,
        coin: wallet.coin,
        chainId: wallet.chainId,
        enabled: true,
      });
    }
    return provider.save();
  }
}
