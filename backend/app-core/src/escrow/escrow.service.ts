import { Injectable, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { REDIS_CLIENT } from '../redis/redis.module';
import { EscrowOrder, EscrowOrderDocument } from './schemas/escrow-order.schema';
import { CreateEscrowOrderDto } from './dto/create-escrow-order.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { Provider, ProviderDocument } from '../providers/schemas/provider.schema';
import { Chat, ChatDocument } from '../providers/schemas/chat-schema/chat.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { Erc20Ledger, Erc20LedgerDocument } from '../wallet/schemas/erc20-ledger.schema';
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
    @InjectModel(Erc20Ledger.name) private readonly erc20LedgerModel: Model<Erc20LedgerDocument>,
    @InjectQueue(EscrowQueueType.ESCROW_FUNDING) private readonly escrowFundingQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_RELEASE) private readonly escrowReleaseQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_STATUS_EVENTS) private readonly escrowStatusQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_CANCEL) private readonly escrowCancelQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_GAS_ESTIMATE) private readonly escrowGasEstimateQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_DISPUTE_MARK) private readonly escrowDisputeMarkQueue: Queue,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: any,
  ) { }



  // CONSTANTE QUE DEFINE EL MONTO MINIMO EN DOLARES QUE DEBE POSEER UN VENDEDOR PARA CREAR UNA ORDEN P2P
  private static readonly MIN_ORDER_USD = 10;



  // MAPEO DE SIMBOLOS DE MONEDA A IDENTIFICADORES DE COINGECKO PARA OBTENER SU PRECIO ACTUALIZADO
  private readonly coinIds: Record<string, string> = {
    bnb: 'binancecoin',
    avax: 'avalanche-2',
    s: 'sonic-3',
    eth: 'ethereum',
    matic: 'matic-network',
    op: 'optimism',
    usdt: 'tether',
    usdc: 'usd-coin',
  };

  // PRECIO DE FALLBACK PARA STABLECOINS EN TESTNET DONDE COINGECKO NO RETORNA PRECIO
  private readonly stablecoinFallbackPrice: Record<string, number> = {
    usdt: 1,
    usdc: 1,
  };



  // OBTIENE EL PRECIO ACTUAL EN USD DE UNA MONEDA CONSULTANDO PRIMERO EL CACHE REDIS Y LUEGO COINGECKO SI NO HAY CACHE
  private async getCoinPriceUsd(coin: string): Promise<number> {
    const key = coin.toLowerCase().trim();
    const id = this.coinIds[key] || key;
    const cacheKey = `price:${id}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Number(parsed?.USD || 0);
      }
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`,
      );
      if (!res.ok) return 0;
      const data: any = await res.json();
      const usd = Number(data?.[id]?.usd ?? 0);
      if (usd > 0) {
        await this.redis.setEx(cacheKey, 60, JSON.stringify({ USD: usd }));
      }
      return usd;
    } catch (err) {
      console.error('[ESCROW] Failed to fetch coin price for minimum balance check:', (err as Error).message);
      return 0; // fail-open: allow order if price unavailable
    }
  }



  // ESCAPA CARACTERES ESPECIALES DE REGEX EN EMAILS (ej. '+' o '(') PARA EVITAR
  // SyntaxError -> 500 AL CONSTRUIR LA CONSULTA INSENSIBLE A MAYUSCULAS
  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }



  // REDUCE LOS DECIMALES DE UN VALOR FLOTANTE PARA EVITAR PROBLEMAS DE PRECISION MATEMATICA EN LA BLOCKCHAIN
  private truncateToDecimals(value: number, decimals: number = 8): number {
    const factor = 10 ** decimals;
    return Math.floor(value * factor) / factor;
  }



  // NOTA 2026-10-04: expireOrders/markCompleted/registerRefundTransaction eliminados (codigo muerto sin llamadas); la expiracion viva esta en daemon/workers/local/escrowExpiry.js



  // VALIDA LOS FONDOS DEL USUARIO COBRA LAS TARIFAS CORRESPONDIENTES Y CREA EL REGISTRO DE UNA NUEVA ORDEN P2P EN ESPERA
  async createOrder(dto: CreateEscrowOrderDto, email: string) {
    const sellerEmail = email;
    const provider = await this.providerModel.findOne({ email: String(dto.providerEmail), isValid: true });
    if (!provider) {
      throw new BadRequestException('Provider not found or not verified.');
    }
    // El match debe incluir la chain: el mismo simbolo (USDC) existe en varias chains y el find solo por coin elegia la primera (bug cross-chain)
    const reqChainId = dto.chainId ? Number(dto.chainId) : undefined;
    const matchByChain = (w: any) =>
      w.coin?.toUpperCase() === dto.coin?.toUpperCase() &&
      w.enabled &&
      (reqChainId === undefined || Number(w.chainId) === reqChainId);
    const matchedWallet = provider.destinationWallets?.find(matchByChain);
    if (!matchedWallet) {
      throw new BadRequestException(
        reqChainId !== undefined
          ? 'Provider does not accept this coin on the selected network.'
          : 'Provider does not accept this coin or has no valid wallet configured for it.',
      );
    }
    // Para ERC20 exigir ademas que el token coincida (misma coin en otra chain = otro contrato)
    if (dto.isToken && dto.tokenAddress) {
      const expected = String(dto.tokenAddress).toLowerCase();
      const got = String(matchedWallet.tokenAddress || '').toLowerCase();
      if (matchedWallet.tokenAddress && got !== expected) {
        throw new BadRequestException('Provider wallet token does not match the selected token contract.');
      }
    }
    if (provider.paymentMethods.length === 0) {
      throw new BadRequestException('Provider has no payment methods configured.');
    }
    if (!provider.paymentMethods.includes(dto.paymentMethod)) {
      throw new BadRequestException('Provider does not accept this payment method.');
    }
    // --- DETERMINAR SI ES TOKEN ERC20 O MONEDA NATIVA ---
    const isTokenOrder = dto.isToken && dto.tokenAddress;

    // Para tokens ERC20, necesitamos buscar la wallet de la cadena padre (ej: wallet MATIC para USDC en Polygon)
    // La wallet nativa contiene la dirección donde el ledger ERC20 tiene el balance del token
    // La chain de referencia es la del asset que eligio el seller (dto.chainId), no la del provider
    let walletCoinToSearch = dto.coin;
    let sellerChainId: number | undefined = reqChainId;
    if (isTokenOrder) {
      // Mapear token → moneda nativa de la cadena donde vive
      const chainCoinMap: Record<number, string> = { 11155111: 'ETH', 97: 'BNB', 80002: 'MATIC', 43113: 'AVAX', 14601: 'S', 11155420: 'OP' };
      const refChain = reqChainId ?? matchedWallet.chainId;
      sellerChainId = refChain;
      walletCoinToSearch = chainCoinMap[refChain] || dto.coin;
    } else if (reqChainId !== undefined) {
      sellerChainId = reqChainId;
    }

    const walletMatch: any = { coin: walletCoinToSearch };
    if (sellerChainId !== undefined) {
      walletMatch.chainId = sellerChainId;
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
            { $match: walletMatch }
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

    if (isTokenOrder) {
      // --- FLUJO ERC20 TOKEN ---
      const ledger = await this.erc20LedgerModel.findOne({
        walletAddress: wallet.address.toLowerCase(),
        tokenAddress: dto.tokenAddress.toLowerCase(),
        chainId: wallet.chainId,
      });
      if (!ledger) {
        throw new BadRequestException('No token balance found for the specified token.');
      }
      const tokenBalance = ledger.available_balance || 0;

      // Verificar balance mínimo en USD
      let coinPriceUsd = await this.getCoinPriceUsd(dto.coin);
      if (coinPriceUsd === 0) {
        coinPriceUsd = this.stablecoinFallbackPrice[dto.coin.toLowerCase()] || 0;
      }
      if (coinPriceUsd > 0) {
        const balanceUsd = tokenBalance * coinPriceUsd;
        if (balanceUsd < EscrowService.MIN_ORDER_USD) {
          throw new BadRequestException('You do not have the minimum balance to create a P2P order.');
        }
      }

      // Para tokens ERC20 no cobramos gas del token (gas se paga en moneda nativa)
      const gasFee = 0;
      const totalDeduction = dto.amount;

      if (tokenBalance < totalDeduction) {
        throw new BadRequestException(
          `Insufficient token balance. Required: ${totalDeduction} ${dto.coin}, Available: ${tokenBalance} ${dto.coin}`
        );
      }

      // Descontar del ledger ERC20 con guarda atomica: si dos ordenes concurrentes
      // leen el mismo balance, solo una reclama los fondos (evita doble-gasto)
      const debitResult = await this.erc20LedgerModel.updateOne(
        { _id: ledger._id, available_balance: { $gte: totalDeduction } },
        { $inc: { available_balance: -totalDeduction } }
      );
      if (debitResult.modifiedCount === 0) {
        throw new BadRequestException(
          `Insufficient token balance. Required: ${totalDeduction} ${dto.coin}, Available: ${tokenBalance} ${dto.coin}`
        );
      }

      const orderId = uuidv4();
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
        tokenAddress: dto.tokenAddress,
        isToken: true,
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
        tokenAddress: dto.tokenAddress,
        isToken: true,
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

    } else {
      // --- FLUJO MONEDA NATIVA (sin cambios) ---
      const coinPriceUsd = await this.getCoinPriceUsd(dto.coin);
      if (coinPriceUsd > 0) {
        const balanceUsd = wallet.balance * coinPriceUsd;
        if (balanceUsd < EscrowService.MIN_ORDER_USD) {
          throw new BadRequestException(
            'You do not have the minimum balance to create a P2P order.',
          );
        }
      }
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
      // Debito atomico: el filtro balance >= totalDeduction evita que dos ordenes
      // concurrentes sobregiren la wallet (check-then-act seria race condition)
      const debitResult = await this.walletModel.updateOne(
        { _id: new Types.ObjectId(wallet._id), balance: { $gte: totalDeduction } },
        { $inc: { balance: -totalDeduction } }
      );
      if (debitResult.modifiedCount === 0) {
        throw new BadRequestException(
          `Insufficient balance. Required: ${totalDeduction} ${dto.coin} (amount: ${dto.amount} + gas: ${gasFee})`
        );
      }
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
        email: { $regex: new RegExp(`^${this.escapeRegExp(order.providerEmail.trim())}$`, 'i') }
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
        email: { $regex: new RegExp(`^${this.escapeRegExp(order.sellerEmail.trim())}$`, 'i') }
      }).lean().exec();
      if (!user) {
        user = await this.providerModel.findOne({
          email: { $regex: new RegExp(`^${this.escapeRegExp(order.sellerEmail.trim())}$`, 'i') }
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
    const order = await this.escrowOrderModel.findOne({ orderId: String(orderId) }).lean().exec();
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
    const order = await this.escrowOrderModel.findOne({ orderId: String(orderId) });
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
    const order = await this.escrowOrderModel.findOne({ orderId: String(orderId) });
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
      isToken: order.isToken,
      tokenAddress: order.tokenAddress,
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
    const order = await this.escrowOrderModel.findOne({ orderId: String(orderId) });
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
      jobId: `escrow-dispute-mark-${orderId}`,
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
    const order = await this.escrowOrderModel.findOne({ orderId: String(orderId) });
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
      jobId: `escrow-cancel-${order.orderId}`,
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



  async getDisputedOrders(email: string) {
    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim().toLowerCase());
    const user = await this.userModel.findOne({ email });
    const isDbAdmin = user?.isAdmin === true;
    const isEnvAdmin = adminEmails.includes(email.toLowerCase());

    if (!isDbAdmin && !isEnvAdmin) {
      throw new ForbiddenException('Only administrators can view disputed orders.');
    }
    return await this.escrowOrderModel.find({ status: { $in: ['disputed', 'resolved'] } }).sort({ createdAt: -1 }).lean().exec();
  }



  async resolveDispute(orderId: string, type: 'revert' | 'award', email: string) {
    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim().toLowerCase());
    const user = await this.userModel.findOne({ email });
    const isDbAdmin = user?.isAdmin === true;
    const isEnvAdmin = adminEmails.includes(email.toLowerCase());

    if (!isDbAdmin && !isEnvAdmin) {
      throw new ForbiddenException('Only administrators can resolve disputes.');
    }
    // CLAIM ATOMICO: solo el primer admin en resolver reclama la orden. Sin esto,
    // dos resoluciones concurrentes podian dejar isReverted + isAwarded en true.
    const claimUpdate = type === 'revert' ? { isReverted: true } : { isAwarded: true };
    const order = await this.escrowOrderModel.findOneAndUpdate(
      { orderId: String(orderId), status: 'disputed', isReverted: false, isAwarded: false },
      { $set: claimUpdate },
      { returnDocument: 'after' },
    );
    if (!order) {
      const current = await this.escrowOrderModel.findOne({ orderId: String(orderId) }).lean().exec();
      if (!current) {
        throw new BadRequestException('Order not found.');
      }
      if (current.isReverted && current.isAwarded) {
        throw new BadRequestException('Invalid state: both isReverted and isAwarded cannot be true.');
      }
      if (current.isReverted || current.isAwarded) {
        throw new BadRequestException('Dispute already resolved.');
      }
      throw new BadRequestException(`Cannot resolve dispute for order with status: ${current.status}`);
    }
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



}
