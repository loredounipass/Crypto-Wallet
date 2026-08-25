import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { EscrowOrder, EscrowOrderDocument } from './schemas/escrow-order.schema';
import { CreateEscrowOrderDto } from './dto/create-escrow-order.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { Provider, ProviderDocument } from '../providers/schemas/provider.schema';
import { Chat, ChatDocument } from '../providers/schemas/chat-schema/chat.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { default as EscrowQueueType } from './queue/types.queue';

@Injectable()
export class EscrowService {
  constructor(
    @InjectModel(EscrowOrder.name) private readonly escrowOrderModel: Model<EscrowOrderDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(Provider.name) private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectQueue(EscrowQueueType.ESCROW_FUNDING) private readonly escrowFundingQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_RELEASE) private readonly escrowReleaseQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_STATUS_EVENTS) private readonly escrowStatusQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_CANCEL) private readonly escrowCancelQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_GAS_ESTIMATE) private readonly escrowGasEstimateQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_DISPUTE_MARK) private readonly escrowDisputeMarkQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_REFUND) private readonly escrowRefundQueue: Queue,
    private readonly configService: ConfigService,
  ) { }



  // REDUCE LOS DECIMALES DE UN VALOR FLOTANTE PARA EVITAR PROBLEMAS DE PRECISION MATEMATICA EN LA BLOCKCHAIN
  private truncateToDecimals(value: number, decimals: number = 8): number {
    const factor = 10 ** decimals;
    return Math.floor(value * factor) / factor;
  }



  // BUSCA LA BILLETERA DEL USUARIO Y REGISTRA EN LA BASE DE DATOS EL REEMBOLSO DE UNA TRANSACCION FALLIDA O CANCELADA
  private async registerRefundTransaction(order: any, refundTxHash: string | null) {
    const coin = String(order.coin || '').toUpperCase();
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase();
    const chainId = Number(order.chainId);
    const txHashToUse = refundTxHash ? String(refundTxHash).toLowerCase() : `internal-refund-${order.orderId}`;
    const existing = await this.transactionModel.findOne({ txHash: txHashToUse });
    if (existing) {
      return existing;
    }
    const walletData = await this.userModel.aggregate([
      { $match: { email: order.sellerEmail } },
      { $unwind: '$wallets' },
      { $project: { _id: 0 } },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallets',
          foreignField: '_id',
          as: 'walletsData',
          pipeline: [
            { $match: { coin: order.coin } }
          ]
        }
      }
    ]).exec();
    let wallet = null;
    if (walletData && walletData.length > 0) {
      const walletEntry = walletData.find(w => w.walletsData.length > 0);
      if (walletEntry) {
        wallet = walletEntry.walletsData[0];
      }
    }
    if (!wallet) {
      console.error(`[ESCROW] Wallet not found for refund: seller=${order.sellerEmail} coin=${order.coin} chainId=${order.chainId}`);
      throw new Error(`Wallet not found for refund: order ${order.orderId}`);
    }
    const isInternal = !refundTxHash;
    const transaction = new this.transactionModel({
      nature: 1,
      amount: Number(order.amount || 0),
      created_at: Date.now(),
      status: isInternal ? 3 : 1,
      confirmations: 0,
      txHash: txHashToUse,
      to: order.sellerWalletAddress
    });
    let savedTransaction = transaction;
    try {
      await transaction.save();
    } catch (err: any) {
      if (err.code === 11000) {
        console.log(`[ESCROW] Duplicate txHash on refund, using existing tracking doc for order ${order.orderId}`);
        const existingDoc = await this.transactionModel.findOne({ txHash: txHashToUse });
        if (existingDoc) {
          savedTransaction = existingDoc;
        }
      } else {
        throw err;
      }
    }
    await this.walletModel.updateOne(
      { _id: new Types.ObjectId(wallet._id) },
      { $addToSet: { transactions: savedTransaction._id } }
    );
    if (isInternal) {
      await this.walletModel.updateOne(
        { _id: new Types.ObjectId(wallet._id) },
        { $inc: { balance: order.amount } }
      );
    }
    return savedTransaction;
  }



  // VALIDA LOS FONDOS DEL USUARIO COBRA LAS TARIFAS CORRESPONDIENTES Y CREA EL REGISTRO DE UNA NUEVA ORDEN P2P EN ESPERA
  async createOrder(dto: CreateEscrowOrderDto, email: string) {
    const sellerEmail = email;
    const provider = await this.providerModel.findOne({ email: dto.providerEmail, isValid: true });
    if (!provider) {
      throw new BadRequestException('Provider not found or not verified.');
    }
    const matchedWallet = provider.destinationWallets?.find(w => w.coin?.toUpperCase() === dto.coin?.toUpperCase() && w.enabled);
    if (!matchedWallet) {
      throw new BadRequestException('Provider does not accept this coin or has no valid wallet configured for it.');
    }
    if (provider.paymentMethods.length === 0) {
      throw new BadRequestException('Provider has no payment methods configured.');
    }
    if (!provider.paymentMethods.includes(dto.paymentMethod)) {
      throw new BadRequestException('Provider does not accept this payment method.');
    }
    const userData = await this.userModel.aggregate([
      { $match: { email: sellerEmail } },
      { $unwind: '$wallets' },
      { $project: { _id: 0 } },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallets',
          foreignField: '_id',
          as: 'walletsData',
          pipeline: [
            { $match: { coin: dto.coin } }
          ]
        }
      }
    ]).exec();
    if (!userData || userData.length === 0) {
      throw new BadRequestException('No wallet found for the specified coin.');
    }
    const walletEntry = userData.find(w => w.walletsData.length > 0);
    if (!walletEntry) {
      throw new BadRequestException('No wallet found for the specified coin.');
    }
    const wallet = walletEntry.walletsData[0];
    const orderId = uuidv4();
    const gasEstimate = await this.getGasEstimate(dto.coin, wallet.chainId);
    const gasFee = gasEstimate.gasFee;
    if (dto.amount <= gasFee) {
      throw new BadRequestException(
        `Amount must be greater than network gas fee. Amount: ${dto.amount} ${dto.coin}, Gas: ${gasFee} ${dto.coin}`
      );
    }
    let totalDeduction = dto.amount + gasFee;
    if (wallet.balance < totalDeduction && wallet.balance > gasFee * 2) {
      const adjustedAmount = this.truncateToDecimals(wallet.balance - gasFee, 8);
      console.log(`[ESCROW] Auto-adjusting amount: ${dto.amount} → ${adjustedAmount} ${dto.coin} (balance=${wallet.balance}, gas=${gasFee})`);
      dto.amount = adjustedAmount;
      totalDeduction = dto.amount + gasFee;
    }
    if (wallet.balance < totalDeduction) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${totalDeduction} ${dto.coin} (amount: ${dto.amount} + gas: ${gasFee})`
      );
    }
    await this.walletModel.updateOne(
      { _id: new Types.ObjectId(wallet._id) },
      { $inc: { balance: -totalDeduction } }
    );
    const chatroomId = uuidv4();
    const chat = new this.chatModel({
      chatName: `P2P Order - ${dto.coin} ${dto.amount}`,
      users: [sellerEmail, dto.providerEmail],
      chatroomId,
      latestMessage: 'P2P Order created. Funds are in escrow.',
    });
    await chat.save();
    const expirySeconds = parseInt(this.configService.get<string>('ESCROW_ORDER_EXPIRY_SECONDS') || '1800');
    const escrowOrder = new this.escrowOrderModel({
      orderId,
      sellerEmail,
      providerEmail: dto.providerEmail,
      sellerWalletAddress: wallet.address,
      providerWalletAddress: matchedWallet.address,
      coin: dto.coin,
      chainId: wallet.chainId,
      amount: dto.amount,
      fiatAmount: dto.fiatAmount,
      paymentMethod: dto.paymentMethod,
      status: 'pending',
      chatroomId,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
      gasFee,
    });
    await escrowOrder.save();
    await this.escrowFundingQueue.add('fund', {
      orderId,
      sellerWalletAddress: wallet.address,
      providerWalletAddress: matchedWallet.address,
      amount: dto.amount,
      coin: dto.coin,
      chainId: wallet.chainId,
      gasFee,
      sellerEmail,
      providerEmail: dto.providerEmail,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    });
    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'pending',
      sellerEmail,
      providerEmail: dto.providerEmail,
    }, { removeOnComplete: true, removeOnFail: 50 });
    return {
      orderId,
      chatroomId,
      status: 'pending',
      amount: dto.amount,
      coin: dto.coin,
      providerEmail: dto.providerEmail,
      paymentMethod: dto.paymentMethod,
      gasFee,
    };
  }



  // SE COMUNICA CON EL WORKER EN SEGUNDO PLANO PARA ESTIMAR EL COSTO ACTUAL DEL GAS EN LA RED SELECCIONADA
  async getGasEstimate(coin: string, chainId: number): Promise<{ gasFee: number; gasFeeFormatted: string }> {
    console.log('[P2P Gas Estimate] Delegating to worker:', { coin, chainId });
    const queueEvents = new QueueEvents(EscrowQueueType.ESCROW_GAS_ESTIMATE, {
      connection: {
        host: this.configService.get('REDIS_HOST'),
        port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
        password: this.configService.get('REDIS_PASS') || undefined,
      },
    });
    try {
      const job = await this.escrowGasEstimateQueue.add('estimate', { coin, chainId }, {
        removeOnComplete: true,
        removeOnFail: 50,
      });
      const result = await job.waitUntilFinished(queueEvents, 30000);
      return result as { gasFee: number; gasFeeFormatted: string };
    } catch (err) {
      console.error('[P2P Gas Estimate] Worker did not respond in time:', err instanceof Error ? err.message : err);
      const coinsInfo = require('../../../config/coins/info.js');
      const fee = coinsInfo[coin.toUpperCase()]?.fee || 0.005;
      return {
        gasFee: fee,
        gasFeeFormatted: fee.toFixed(8),
      };
    } finally {
      await queueEvents.close();
    }
  }



  // RECUPERA DE LA BASE DE DATOS TODAS LAS ORDENES DONDE EL USUARIO PARTICIPA COMO CREADOR O COMPRADOR
  async getMyOrders(email: string) {
    const orders = await this.escrowOrderModel
      .find({ sellerEmail: email })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    for (const order of orders) {
      if (!order.providerEmail) {
        (order as any).counterpartName = 'Unknown';
        continue;
      }
      const provider = await this.providerModel.findOne({
        email: { $regex: new RegExp(`^${order.providerEmail.trim()}$`, 'i') }
      }).lean().exec();
      if (provider && (provider.firstName || provider.lastName)) {
        (order as any).counterpartName = `${provider.firstName || ''} ${provider.lastName || ''}`.trim();
      } else {
        (order as any).counterpartName = order.providerEmail;
      }
    }
    return orders;
  }



  // RECUPERA DE LA BASE DE DATOS TODAS LAS ORDENES DONDE EL USUARIO OFRECE LIQUIDEZ COMO PROVEEDOR
  async getProviderOrders(email: string) {
    const orders = await this.escrowOrderModel
      .find({ providerEmail: email })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    for (const order of orders) {
      if (!order.sellerEmail) {
        (order as any).counterpartName = 'Unknown';
        continue;
      }
      let user: any = await this.userModel.findOne({
        email: { $regex: new RegExp(`^${order.sellerEmail.trim()}$`, 'i') }
      }).lean().exec();
      if (!user) {
        user = await this.providerModel.findOne({
          email: { $regex: new RegExp(`^${order.sellerEmail.trim()}$`, 'i') }
        }).lean().exec();
      }
      if (user && (user.firstName || user.lastName)) {
        (order as any).counterpartName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      } else {
        (order as any).counterpartName = order.sellerEmail;
      }
    }
    return orders;
  }



  // BUSCA UNA ORDEN POR SU IDENTIFICADOR UNICO Y VERIFICA QUE EL USUARIO TENGA PERMISOS PARA VERLA
  async getOrder(orderId: string, email: string) {
    const order = await this.escrowOrderModel.findOne({ orderId }).lean().exec();
    if (!order) {
      throw new BadRequestException('Order not found.');
    }
    if (order.sellerEmail !== email && order.providerEmail !== email) {
      throw new ForbiddenException('You are not part of this order.');
    }
    return order;
  }



  // ACTUALIZA EL ESTADO DE LA ORDEN INDICANDO QUE EL PROVEEDOR YA RECIBIO EL PAGO FIAT EN SU CUENTA
  async confirmPayment(orderId: string, email: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }
    if (order.providerEmail !== email) {
      throw new ForbiddenException('Only the provider can confirm payment.');
    }
    if (order.status !== 'funded') {
      throw new BadRequestException(`Cannot confirm payment for order with status: ${order.status}`);
    }
    order.status = 'buyer_paid';
    order.buyerConfirmedPayment = true;
    await order.save();
    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'buyer_paid',
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
    }, { removeOnComplete: true, removeOnFail: 50 });
    return { orderId, status: 'buyer_paid' };
  }



  // COMPRUEBA DIRECTAMENTE EN LA BLOCKCHAIN SI LA TRANSACCION ORIGINAL YA ALCANZO LAS CONFIRMACIONES NECESARIAS
  private async isFundingConfirmed(order: any): Promise<boolean> {
    if (!order.escrowTxHash) {
      return false;
    }
    if (order.escrowTxHash.startsWith('offchain-')) {
      return true;
    }
    const fundingTx = await this.transactionModel.findOne({
      txHash: order.escrowTxHash,
      status: 3
    });
    return !!fundingTx;
  }



  // INICIA EL PROCESO DE LIBERACION DE FONDOS ENVIANDO LA TAREA A LA COLA DE TRABAJO PARA SU EJECUCION ON CHAIN
  async releaseFunds(orderId: string, email: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }
    if (order.sellerEmail !== email) {
      throw new ForbiddenException('Only the seller can release funds.');
    }
    if (order.status !== 'buyer_paid') {
      throw new BadRequestException(`Cannot release funds for order with status: ${order.status}`);
    }
    if (!order.escrowTxHash) {
      throw new BadRequestException('The funds are not yet locked in escrow. Wait a few seconds and try again.');
    }
    const funded = await this.isFundingConfirmed(order);
    if (!funded) {
      throw new BadRequestException('The escrow funds are still pending confirmation. Please wait until the transaction reaches 12 confirmations before releasing.');
    }
    order.status = 'released';
    order.sellerConfirmedRelease = true;
    await order.save();
    await this.escrowReleaseQueue.add('release', {
      orderId: order.orderId,
      providerWalletAddress: order.providerWalletAddress,
      sellerWalletAddress: order.sellerWalletAddress,
      amount: order.amount,
      coin: order.coin,
      chainId: order.chainId,
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
    }, {
      jobId: `escrow-release-${order.orderId}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    });
    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'released',
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
    }, { removeOnComplete: true, removeOnFail: 50 });
    return { orderId, status: 'released' };
  }



  // MARCA LA ORDEN COMO DISPUTADA Y ENVIA UNA ALERTA PARA QUE LOS ADMINISTRADORES INTERVENGAN EN EL CONFLICTO
  async openDispute(orderId: string, email: string, reason: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }
    if (order.sellerEmail !== email && order.providerEmail !== email) {
      throw new ForbiddenException('You are not part of this order.');
    }
    const validStatuses = ['funded', 'buyer_paid'];
    if (!validStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot open dispute for order with status: ${order.status}`);
    }
    order.status = 'disputed';
    order.disputeReason = reason || 'No reason provided';
    order.disputeOpenedBy = email;
    await order.save();
    await this.escrowDisputeMarkQueue.add('mark-dispute', {
      orderId,
      chainId: order.chainId,
      escrowTxHash: order.escrowTxHash,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      removeOnFail: 50,
    });
    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'disputed',
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
      disputeReason: order.disputeReason,
      disputeOpenedBy: email,
    }, { removeOnComplete: true, removeOnFail: 50 });
    return { orderId, status: 'disputed' };
  }



  // CANCELA LA ORDEN EN EL SISTEMA Y PONE EN COLA LA DEVOLUCION DE LOS FONDOS AL WALLET ORIGINAL DEL CREADOR
  async cancelOrder(orderId: string, email: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }
    if (order.sellerEmail !== email) {
      throw new ForbiddenException('Only the seller can cancel the order.');
    }
    const cancellableStatuses = ['pending', 'funded'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
    }
    order.status = 'cancelled';
    await order.save();
    await this.escrowCancelQueue.add('cancel', {
      orderId: order.orderId,
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
    }, {
      attempts: 20,
      backoff: { type: 'exponential', delay: 5000 },
    });
    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'cancelled',
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
    }, { removeOnComplete: true, removeOnFail: 50 });
    return { orderId, status: 'cancelled' };
  }



  // FILTRA Y DEVUELVE UNICAMENTE LAS ORDENES QUE ESTAN EN ESTADO DE DISPUTA PARA EL PANEL DE ADMINISTRACION
  async getDisputedOrders(email: string) {
    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim().toLowerCase());
    if (!adminEmails.includes(email.toLowerCase())) {
      throw new ForbiddenException('Only administrators can view disputed orders.');
    }
    return await this.escrowOrderModel.find({ status: 'disputed' }).sort({ createdAt: -1 }).lean().exec();
  }



  // APLICA LA DECISION DEL ADMINISTRADOR SOBRE UNA DISPUTA MARCANDO QUIEN SE QUEDA CON LOS FONDOS RETENIDOS
  async resolveDispute(orderId: string, type: 'revert' | 'award', email: string) {
    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim().toLowerCase());
    if (!adminEmails.includes(email.toLowerCase())) {
      throw new ForbiddenException('Only administrators can resolve disputes.');
    }
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }
    if (order.status !== 'disputed') {
      throw new BadRequestException(`Cannot resolve dispute for order with status: ${order.status}`);
    }
    if (order.isReverted && order.isAwarded) {
      throw new BadRequestException('Invalid state: both isReverted and isAwarded cannot be true.');
    }
    if (order.isReverted || order.isAwarded) {
      throw new BadRequestException('Dispute already resolved.');
    }
    if (type === 'revert') {
      order.isReverted = true;
    } else {
      order.isAwarded = true;
    }
    await order.save();
    console.log(`[ESCROW] Admin resolved dispute: ${orderId} -> ${type}`);
    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'disputed',
      resolutionType: type,
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
    }, { removeOnComplete: true, removeOnFail: 50 });
    return { orderId, status: 'disputed', isReverted: order.isReverted, isAwarded: order.isAwarded };
  }



  // ACTUALIZA LAS ESTADISTICAS DEL PROVEEDOR Y MARCA LA ORDEN COMO COMPLETADA TRAS UNA LIBERACION EXITOSA
  async markCompleted(orderId: string, releaseTxHash?: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) return;
    order.status = 'completed';
    if (releaseTxHash) {
      order.releaseTxHash = releaseTxHash;
    }
    await order.save();
    await this.providerModel.updateOne(
      { email: order.providerEmail },
      {
        $inc: {
          completedOrders: 1,
          totalTradeVolume: order.fiatAmount,
        }
      }
    );
    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'completed',
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
    }, { removeOnComplete: true, removeOnFail: 50 });
  }



  // BUSCA TODAS LAS ORDENES QUE SUPERARON SU TIEMPO LIMITE Y EMITE AUTOMATICAMENTE LOS REEMBOLSOS CORRESPONDIENTES
  async expireOrders() {
    const expiredOrders = await this.escrowOrderModel.find({
      status: { $in: ['pending', 'funded'] },
      expiresAt: { $lt: new Date() },
    }).exec();
    for (const order of expiredOrders) {
      try {
        let refundTxHash = null;
        if (order.escrowTxHash) {
          try {
            const queueEvents = new QueueEvents(EscrowQueueType.ESCROW_REFUND, {
              connection: {
                host: this.configService.get('REDIS_HOST'),
                port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
                password: this.configService.get('REDIS_PASS') || undefined,
              },
            });
            try {
              const job = await this.escrowRefundQueue.add('refund', {
                orderId: order.orderId,
                chainId: order.chainId,
                sellerWalletAddress: order.sellerWalletAddress,
                amount: order.amount,
                coin: order.coin,
              }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: true,
                removeOnFail: 50,
              });
              refundTxHash = await job.waitUntilFinished(queueEvents, 60000);
            } finally {
              await queueEvents.close();
            }
          } catch (err) {
            console.error(`[ESCROW-EXPIRE] Failed to refund:`, (err as Error).message);
            continue;
          }
        }
        await this.registerRefundTransaction(order, refundTxHash);
        order.status = 'expired';
        await order.save();
        await this.escrowStatusQueue.add('status-update', {
          orderId: order.orderId,
          status: 'expired',
          sellerEmail: order.sellerEmail,
          providerEmail: order.providerEmail,
        }, { removeOnComplete: true, removeOnFail: 50 });
        console.log(`[ESCROW-EXPIRE] Order expired and refunded: ${order.orderId}`);
      } catch (orderError) {
        console.error(`[ESCROW-EXPIRE] Error processing expired order:`, order.orderId, (orderError as Error).message);
      }
    }
    return { expired: expiredOrders.length };
  }
}
