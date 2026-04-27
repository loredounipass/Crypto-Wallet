import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { EscrowOrder, EscrowOrderDocument } from './schemas/escrow-order.schema';
import { CreateEscrowOrderDto } from './dto/create-escrow-order.dto';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { Provider, ProviderDocument } from '../providers/schemas/provider.schema';
import { Chat, ChatDocument } from '../providers/schemas/chat-schema/chat.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { default as EscrowQueueType } from './queue/types.queue';

const USE_ESCROW_CONTRACT = process.env.ESCROW_USE_CONTRACT === 'true';

@Injectable()
export class EscrowService {
  constructor(
    @InjectModel(EscrowOrder.name) private escrowOrderModel: Model<EscrowOrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectQueue(EscrowQueueType.ESCROW_FUNDING) private escrowFundingQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_RELEASE) private escrowReleaseQueue: Queue,
    @InjectQueue(EscrowQueueType.ESCROW_STATUS_EVENTS) private escrowStatusQueue: Queue,
  ) {}

  private async registerRefundTransaction(order: any, refundTxHash: string | null) {
    const coin = String(order.coin || '').toUpperCase();
    const sellerAddress = String(order.sellerWalletAddress || '').toLowerCase();
    const chainId = Number(order.chainId);

    const txHashToUse = refundTxHash || `internal-refund-${order.orderId}`;

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

    if (!wallet) return null;

    const isInternal = !refundTxHash;
    const transaction = new this.transactionModel({
      nature: 1, // Deposit
      amount: Number(order.amount || 0),
      created_at: Date.now(),
      status: isInternal ? 3 : 1, // Completed if internal, pending if on-chain
      confirmations: 0,
      txHash: txHashToUse,
      to: order.sellerWalletAddress
    });
    await transaction.save();

    await this.walletModel.updateOne(
      { _id: new Types.ObjectId(wallet._id) },
      { $addToSet: { transactions: transaction._id } }
    );

    if (!isInternal) {
      const { Queue: BullMQQueue } = require('../../../config/bullmq');
      const depositsQueue = new BullMQQueue(`${coin.toLowerCase()}-deposits`);
      await depositsQueue.add('deposit', {
        walletAddress: order.sellerWalletAddress,
        transactionHash: txHashToUse,
        chainId,
        coin,
        transactionId: transaction._id.toString()
      }, {
        attempts: 20,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 50
      });
    } else {
      await this.walletModel.updateOne(
        { _id: new Types.ObjectId(wallet._id) },
        { $inc: { balance: order.amount } }
      );
    }

    return transaction;
  }

  // Create a new escrow P2P order
  async createOrder(dto: CreateEscrowOrderDto) {
    const sellerEmail = dto.email;

    // 1. Find the provider and validate
    const provider = await this.providerModel.findOne({ email: dto.providerEmail, isValid: true });
    if (!provider) {
      throw new BadRequestException('Provider not found or not verified.');
    }
    if (!provider.walletAddress) {
      throw new BadRequestException('Provider has no wallet address configured.');
    }
    if (provider.paymentMethods.length === 0) {
      throw new BadRequestException('Provider has no payment methods configured.');
    }
    if (!provider.paymentMethods.includes(dto.paymentMethod)) {
      throw new BadRequestException('Provider does not accept this payment method.');
    }

    // 2. Find seller's wallet and validate balance
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
    const coinInfo = require('../../../config/coins/info.js')[dto.coin.toUpperCase()];
    
    // Generate orderId early for gas estimation
    const orderId = uuidv4();
    
    let exactGasFee = 0;
    try {
      const EscrowContractInteractor = require('../../../config/utils/EscrowContractInteractor.js');
      const interactor = new EscrowContractInteractor(wallet.chainId);
      const { parseUnits, formatUnits } = require('ethers');
      
      const decimals = coinInfo ? coinInfo.decimals : 18;
      const amountWei = parseUnits(dto.amount.toString(), decimals);
      
      // Estimate gas for creation and release
      const createGas = await interactor.estimateCreateOrderGas(orderId, wallet.address, provider.walletAddress, amountWei);
      const releaseGas = await interactor.estimateReleaseFundsGas(orderId);
      
      const totalGasWei = BigInt(createGas.gasPrice) * BigInt(createGas.gasLimit) + 
                          BigInt(releaseGas.gasPrice) * BigInt(releaseGas.gasLimit);
      
      exactGasFee = parseFloat(formatUnits(totalGasWei.toString(), decimals));
      console.log(`[ESCROW] Exact gas fee estimated: ${exactGasFee} ${dto.coin}`);
    } catch (err) {
      console.error('[ESCROW] Failed to estimate gas, using fallback fee:', (err as Error).message);
      exactGasFee = 0; // Don't use coinInfo.fee for gas fallback if we can't estimate
    }

    const platformFee = coinInfo ? coinInfo.fee : 0;
    const totalRequired = dto.amount + exactGasFee + platformFee;

    if (wallet.balance < totalRequired) {
      throw new BadRequestException(`Insufficient balance. Required: ${totalRequired.toFixed(8)} ${dto.coin} (Amount: ${dto.amount} + Gas: ${exactGasFee.toFixed(8)} + Comisión: ${platformFee} ${dto.coin})`);
    }

    // 3. Debit seller's wallet (lock funds + exact gas fee + platform fee in escrow)
    await this.walletModel.updateOne(
      { _id: new Types.ObjectId(wallet._id) },
      { $inc: { balance: -totalRequired } }
    );

    // 4. Create the chatroom for the order
    const chatroomId = uuidv4();
    const chat = new this.chatModel({
      chatName: `P2P Order - ${dto.coin} ${dto.amount}`,
      users: [sellerEmail, dto.providerEmail],
      chatroomId,
      latestMessage: 'Orden P2P creada. Los fondos están en escrow.',
    });
    await chat.save();

    // 5. Create escrow order
    const expirySeconds = parseInt(process.env.ESCROW_ORDER_EXPIRY_SECONDS || '1800');
    const escrowOrder = new this.escrowOrderModel({
      orderId,
      sellerEmail,
      providerEmail: dto.providerEmail,
      sellerWalletAddress: wallet.address,
      providerWalletAddress: provider.walletAddress,
      coin: dto.coin,
      chainId: wallet.chainId,
      amount: dto.amount,
      fiatAmount: dto.fiatAmount,
      paymentMethod: dto.paymentMethod,
      status: 'funded',
      chatroomId,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
    });

    await escrowOrder.save();

    // 6. Enqueue on-chain funding via smart contract
    await this.escrowFundingQueue.add('fund', {
      orderId,
      sellerWalletAddress: wallet.address,
      providerWalletAddress: provider.walletAddress,
      amount: dto.amount,
      coin: dto.coin,
      chainId: wallet.chainId,
      sellerEmail,
      providerEmail: dto.providerEmail,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    });

    // 7. Emit status event
    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'funded',
      sellerEmail,
      providerEmail: dto.providerEmail,
    }, { removeOnComplete: true, removeOnFail: 50 });

    return {
      orderId,
      chatroomId,
      status: 'funded',
      amount: dto.amount,
      coin: dto.coin,
      providerEmail: dto.providerEmail,
      paymentMethod: dto.paymentMethod,
    };
  }

  // Get orders where user is the seller
  async getMyOrders(email: string) {
    return this.escrowOrderModel
      .find({ sellerEmail: email })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  // Get orders where user is the provider
  async getProviderOrders(email: string) {
    return this.escrowOrderModel
      .find({ providerEmail: email })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  // Get a single order by orderId, only if user is involved
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

  // Provider confirms they received the external payment
  async confirmPayment(orderId: string, email: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    // Only provider can confirm payment receipt
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

  // Seller releases funds to the provider after confirming external payment receipt
  async releaseFunds(orderId: string, email: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    // Only seller can release funds
    if (order.sellerEmail !== email) {
      throw new ForbiddenException('Only the seller can release funds.');
    }

    if (order.status !== 'buyer_paid') {
      throw new BadRequestException(`Cannot release funds for order with status: ${order.status}`);
    }

    if (!order.escrowTxHash) {
      throw new BadRequestException('Los fondos aún no están bloqueados en escrow. Espera unos segundos e intenta de nuevo.');
    }

    order.status = 'released';
    order.sellerConfirmedRelease = true;
    await order.save();

    // Enqueue the actual fund transfer
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

  // Either party can open a dispute
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

    if (order.escrowTxHash && USE_ESCROW_CONTRACT) {
      try {
        const EscrowContractInteractor = require('../../../config/utils/EscrowContractInteractor.js');
        const interactor = new EscrowContractInteractor(order.chainId);
        const contractAvailable = await interactor.isContractAvailable();
        if (contractAvailable) {
          console.log(`[ESCROW] Marking order ${orderId} as disputed on-chain...`);
          await interactor.markDisputedOnChain(orderId);
        }
      } catch (err) {
        console.warn(`[ESCROW] Failed to mark disputed on-chain:`, (err as Error).message);
      }
    }

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

  // Cancel order - only if funded and funds haven't moved
  async cancelOrder(orderId: string, email: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    // Only seller can cancel
    if (order.sellerEmail !== email) {
      throw new ForbiddenException('Only the seller can cancel the order.');
    }

    if (order.status !== 'funded') {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
    }

    let refundTxHash = null;

    // Refund on-chain when escrow was already funded
    if (order.escrowTxHash) {
      try {
        const EscrowContractInteractor = require('../../../config/utils/EscrowContractInteractor.js');
        const interactor = new EscrowContractInteractor(order.chainId);
        const { parseUnits } = require('ethers');
        const decimals = require('../../../config/coins/info.js')[order.coin.toUpperCase()]?.decimals || 18;
        const amountWei = parseUnits(String(order.amount), decimals);
        let refunded = false;
        const contractAvailable = await interactor.isContractAvailable();

        if (USE_ESCROW_CONTRACT && contractAvailable) {
          try {
            console.log(`[ESCROW-CANCEL] Refunding order ${orderId} via escrow contract...`);
            const receipt = await interactor.refundFundsOnChain(orderId);
            if (receipt && receipt.status) {
              refunded = true;
              refundTxHash = receipt.transactionHash;
              console.log(`[ESCROW-CANCEL] Contract refund successful.`);
            }
          } catch (contractRefundError) {
            console.warn(`[ESCROW-CANCEL] Contract refund failed, trying escrow wallet fallback:`, (contractRefundError as Error).message);
          }
        }

        if (!refunded) {
          console.log(`[ESCROW-CANCEL] Refunding order ${orderId} from escrow wallet...`);
          const receipt = await interactor.refundFundsFromEscrowWallet(orderId, order.sellerWalletAddress, amountWei);
          if (receipt && receipt.status) {
            refunded = true;
            refundTxHash = receipt.transactionHash;
            console.log(`[ESCROW-CANCEL] Escrow wallet refund successful.`);
          }
        }

        if (!refunded) {
          throw new Error('No refund strategy succeeded');
        }
      } catch (err) {
        console.error(`[ESCROW-CANCEL] Failed to refund on-chain:`, (err as Error).message);
        throw new BadRequestException('Failed to refund funds on-chain. Please try again.');
      }
    }

    await this.registerRefundTransaction(order, refundTxHash);

    order.status = 'cancelled';
    await order.save();

    await this.escrowStatusQueue.add('status-update', {
      orderId,
      status: 'cancelled',
      sellerEmail: order.sellerEmail,
      providerEmail: order.providerEmail,
    }, { removeOnComplete: true, removeOnFail: 50 });

    return { orderId, status: 'cancelled' };
  }

  // Mark order as completed (called by the release worker after successful transfer)
  async markCompleted(orderId: string, releaseTxHash?: string) {
    const order = await this.escrowOrderModel.findOne({ orderId });
    if (!order) return;

    order.status = 'completed';
    if (releaseTxHash) {
      order.releaseTxHash = releaseTxHash;
    }
    await order.save();

    // Update provider stats
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

  // Mark expired orders (called by expiry worker)
  async expireOrders() {
    const expiredOrders = await this.escrowOrderModel.find({
      status: { $in: ['pending', 'funded'] },
      expiresAt: { $lt: new Date() },
    }).exec();

    for (const order of expiredOrders) {
      let refundTxHash = null;

      // Refund on-chain when escrow was already funded
      if (order.escrowTxHash) {
        try {
          const EscrowContractInteractor = require('../../../config/utils/EscrowContractInteractor.js');
          const interactor = new EscrowContractInteractor(order.chainId);
          const { parseUnits } = require('ethers');
          const decimals = require('../../../config/coins/info.js')[order.coin.toUpperCase()]?.decimals || 18;
          const amountWei = parseUnits(String(order.amount), decimals);
          let refunded = false;
          const contractAvailable = await interactor.isContractAvailable();

          if (USE_ESCROW_CONTRACT && contractAvailable) {
            try {
              console.log(`[ESCROW-EXPIRE] Refunding order ${order.orderId} via escrow contract...`);
              const receipt = await interactor.refundFundsOnChain(order.orderId);
              if (receipt && receipt.status) {
                refunded = true;
                refundTxHash = receipt.transactionHash;
                console.log(`[ESCROW-EXPIRE] Contract refund successful.`);
              }
            } catch (contractRefundError) {
              console.warn(`[ESCROW-EXPIRE] Contract refund failed, trying escrow wallet fallback:`, (contractRefundError as Error).message);
            }
          }

          if (!refunded) {
            console.log(`[ESCROW-EXPIRE] Refunding order ${order.orderId} from escrow wallet...`);
            const receipt = await interactor.refundFundsFromEscrowWallet(order.orderId, order.sellerWalletAddress, amountWei);
            if (receipt && receipt.status) {
                refunded = true;
                refundTxHash = receipt.transactionHash;
                console.log(`[ESCROW-EXPIRE] Escrow wallet refund successful.`);
            }
          }

          if (!refunded) {
            throw new Error('No refund strategy succeeded');
          }
        } catch (err) {
          console.error(`[ESCROW-EXPIRE] Failed to refund on-chain:`, (err as Error).message);
          continue; // Skip DB refund if on-chain fails to avoid state mismatch
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
    }

    return { expired: expiredOrders.length };
  }
}
