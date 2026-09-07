import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { QueryDto } from './dto/query.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { WalletContract, WalletContractDocument } from './schemas/wallet-contract.schema';
import { Erc20Ledger, Erc20LedgerDocument } from './schemas/erc20-ledger.schema';
import { getTokenInfo } from './token-info';
import { WithdrawDto } from './dto/withdraw.dto';
import { TokenWithdrawDto } from './dto/token-withdraw.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { default as QueueType } from './queue/types.queue'
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletContract.name) private readonly walletContractModel: Model<WalletContractDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Erc20Ledger.name) private readonly erc20LedgerModel: Model<Erc20LedgerDocument>,
    @InjectQueue(QueueType.WITHDRAW_REQUEST) private readonly withdrawQueue: Queue,
    @InjectQueue(QueueType.TRANSACTION_STATUS_EVENTS) private readonly transactionStatusQueue: Queue,
    @InjectQueue(QueueType.WITHDRAW_TOKEN_REQUEST) private readonly withdrawTokenQueue: Queue
  ) { }



  // RESERVA UNA BILLETERA DEL POOL DE CONTRATOS PREGENERADOS Y LA VINCULA EXCLUSIVAMENTE AL USUARIO
  async create(createWalletDto: CreateWalletDto) {
    let data = await this.userModel.aggregate([
      { $match: { email: String(createWalletDto.email) } },
      { $unwind: '$wallets' },
      { $project: { _id: 0 } },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallets',
          foreignField: '_id',
          as: 'walletsData',
          pipeline: [
            {
              $match: {
                coin: createWalletDto.coin,
                chainId: createWalletDto.chainId
              }
            }
          ]
        }
      }
    ]).exec();
    let exists = true;
    if (!data || data.length === 0)
      exists = false;
    let wallet = exists ? data.find(w => w.walletsData.length > 0) : undefined;
    if (wallet) {
      wallet = wallet.walletsData[0];
      return {
        address: wallet.address,
        chainId: wallet.chainId,
        coin: wallet.coin,
        walletId: wallet._id
      }
    } else {
      const contract = await this.walletContractModel.findOneAndUpdate(
        { chainId: createWalletDto.chainId, reserved: false },
        { reserved: true },
        { returnDocument: 'after' }
      );
      if (!contract) {
        throw new BadRequestException('No available wallet contracts for this chain.');
      }
      const reCheck = await this.userModel.aggregate([
        { $match: { email: String(createWalletDto.email) } },
        { $unwind: '$wallets' },
        { $project: { _id: 0 } },
        {
          $lookup: {
            from: 'wallets',
            localField: 'wallets',
            foreignField: '_id',
            as: 'walletsData',
            pipeline: [
              { $match: { coin: createWalletDto.coin, chainId: createWalletDto.chainId } }
            ]
          }
        },
        { $match: { 'walletsData.0': { $exists: true } } }
      ]).exec();
      if (reCheck.length > 0) {
        await this.walletContractModel.updateOne(
          { _id: contract._id },
          { reserved: false }
        ).catch(e => console.error('[WALLET] Failed to unreserve contract:', e.message));
        const existingWallet = reCheck[0].walletsData[0];
        return {
          address: existingWallet.address,
          chainId: existingWallet.chainId,
          coin: existingWallet.coin,
          walletId: existingWallet._id
        };
      }
      try {
        const wallet = new this.walletModel({
          address: contract.address,
          chainId: createWalletDto.chainId,
          coin: createWalletDto.coin
        });
        const saved = await wallet.save();
        const result = await this.userModel.updateOne(
          { email: String(createWalletDto.email) },
          { $push: { wallets: wallet._id } }
        );
        if (result.modifiedCount > 0) {
          return {
            address: wallet.address,
            chainId: wallet.chainId,
            coin: wallet.coin,
            walletId: wallet._id
          };
        }
        throw new Error('Failed to link wallet to user.');
      } catch (error: any) {
        if (error.code === 11000) {
          await this.walletContractModel.updateOne(
            { _id: contract._id },
            { reserved: false }
          ).catch(e => console.error('[WALLET] Failed to unreserve contract on duplicate:', e.message));
          const existingByAddress = await this.walletModel.findOne({ address: contract.address });
          if (existingByAddress) {
            await this.userModel.updateOne(
              { email: String(createWalletDto.email), wallets: { $ne: existingByAddress._id } },
              { $push: { wallets: existingByAddress._id } }
            );
            return {
              address: existingByAddress.address,
              chainId: existingByAddress.chainId,
              coin: existingByAddress.coin,
              walletId: existingByAddress._id
            };
          }
        }
        throw error;
      }
    }
  }



  // EXTRAE LA INFORMACION DE UNA UNICA BILLETERA BUSCANDOLA POR EL TIPO DE MONEDA REQUERIDO
  async getWallet(email: string, queryDto: QueryDto) {
    const data = await this.userModel.aggregate([
      { $match: { email: String(email) } },
      { $unwind: '$wallets' },
      { $project: { _id: 0 } },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallets',
          foreignField: '_id',
          as: 'walletsData',
          pipeline: [
            {
              $match: { coin: queryDto.coin }
            }
          ]
        }
      }
    ]).exec();
    if (data && data.length > 0) {
      let wallet = data.find(w => w.walletsData.length > 0)
      if (wallet) {
        wallet = wallet.walletsData[0];
        const data = await this.walletModel.findOne(
          { _id: new Types.ObjectId(wallet._id) },
          { _id: 0, transactions: 0, __v: 0 }
        ).exec();
        if (data) {
          return data;
        }
      }
    }
  }



  // RECOPILA Y DEVUELVE UN ARREGLO CON TODAS LAS BILLETERAS CREADAS ACTUALMENTE POR EL USUARIO
  async getWallets(email: string) {
    const data = await this.userModel.aggregate([
      { $match: { email: String(email) } },
      { $unwind: '$wallets' },
      { $project: { _id: 0, wallets: 1 } },
      {
        $lookup: {
          from: "wallets",
          localField: "wallets",
          foreignField: "_id",
          "pipeline": [
            { "$project": { transactions: 0 } }
          ],
          as: "walletsData"
        }
      }
    ]).exec();
    if (data && data.length > 0) {
      const wallets = data.map(wallet => {
        return {
          balance: wallet.walletsData[0].balance,
          address: wallet.walletsData[0].address,
          coin: wallet.walletsData[0].coin,
          chainId: wallet.walletsData[0].chainId,
          walletId: wallet.walletsData[0]._id
        }
      });
      return wallets;
    }
  }



  // CONSULTA EL LIBRO MAYOR DE TOKENS PARA CALCULAR LOS SALDOS REALES Y BLOQUEADOS DE CADA DIRECCION
  async getTokenBalances(email: string) {
    const wallets = await this.getWallets(email);
    if (!wallets || wallets.length === 0) return [];
    const addresses = wallets.map(w => w.address.toLowerCase());
    const ledgerEntries = await this.erc20LedgerModel.find({
      walletAddress: { $in: addresses }
    }).exec();
    return ledgerEntries.map(entry => {
      const info = getTokenInfo(entry.tokenAddress);
      const available = entry.available_balance || 0;
      const locked = entry.locked_for_forward || 0;
      const forwarded = entry.forwarded_total || 0;
      return {
        walletAddress: entry.walletAddress,
        chainId: entry.chainId,
        tokenAddress: entry.tokenAddress,
        tokenSymbol: info?.symbol || 'UNKNOWN',
        tokenDecimals: info?.decimals || 18,
        coinGeckoId: info?.coinGeckoId || null,
        totalDeposits: available + locked + forwarded,
        availableBalance: available,
        lockedForForward: locked,
        forwardedTotal: forwarded,
        freeBalance: Math.max(0, available - locked),
      };
    });
  }



  // CREA UNA TRANSACCION DESCUENTA EL SALDO NATIVO Y ENCOLA EL TRABAJO PARA PROCESAR EL RETIRO EN LA BLOCKCHAIN
  async withdraw(withdrawDto: WithdrawDto) {
    const data = await this.userModel.aggregate([
      { $match: { email: String(withdrawDto.email) } },
      { $unwind: '$wallets' },
      { $project: { _id: 0 } },
      {
        $lookup: {
          from: "wallets",
          localField: "wallets",
          foreignField: "_id",
          as: "walletsData",
          pipeline: [
            {
              $match: { coin: withdrawDto.coin }
            }
          ]
        }
      }
    ]).exec();
    if (data && data.length > 0) {
      let wallet = data.find(w => w.walletsData.length > 0)
      if (wallet) {
        wallet = wallet.walletsData[0];
        const transaction = new this.transactionModel({
          nature: 2,
          amount: -1 * withdrawDto.amount,
          created_at: Date.now(),
          status: 1,
          txHash: uuidv4(),
          to: withdrawDto.to
        });
        const saved = await transaction.save();
        if (saved) {
          await this.transactionStatusQueue.add('status-update', {
            transactionId: transaction._id.toString(),
            status: transaction.status,
            confirmations: transaction.confirmations ?? 0,
            source: 'app-core-withdraw'
          }, {
            removeOnComplete: true,
            removeOnFail: 50
          });
          const result = await this.walletModel.findOneAndUpdate(
            { _id: new Types.ObjectId(wallet._id), balance: { $gte: withdrawDto.amount } },
            {
              $push: { transactions: transaction },
              $inc: { balance: transaction.amount }
            });
          if (result) {
            await this.withdrawQueue.add('request', {
              transactionId: transaction._id.toString(),
              walletId: wallet._id.toString(),
              amount: withdrawDto.amount,
              withdrawAddress: withdrawDto.to,
            });
            return {
              error: null,
              data: 'success'
            };
          }
          await this.transactionModel.deleteOne({ _id: transaction._id });
          await this.transactionStatusQueue.add('status-update', {
            transactionId: transaction._id.toString(),
            status: 4,
            confirmations: 0,
            source: 'app-core-withdraw-cancelled'
          }, { removeOnComplete: true, removeOnFail: 50 });
        }
        return {
          error: true,
          msg: 'Insuficient balance'
        };
      }
    }
  }



  // VERIFICA FONDOS DE TOKENS REGISTRA LA OPERACION Y ENVIA EL RETIRO A LA COLA DE PROCESAMIENTO SECUNDARIO
  async withdrawToken(tokenWithdrawDto: TokenWithdrawDto) {
    const wallets = await this.getWallets(tokenWithdrawDto.email);
    if (!wallets || wallets.length === 0) {
      return { error: true, msg: 'No wallets found' };
    }
    const chainEntries = await this.erc20LedgerModel.find({
      walletAddress: { $in: wallets.map(w => w.address.toLowerCase()) },
      tokenAddress: tokenWithdrawDto.tokenAddress
    }).exec();
    if (!chainEntries || chainEntries.length === 0) {
      return { error: true, msg: 'No token balance found for this wallet' };
    }
    const entry = chainEntries[0];
    let available = entry.available_balance || 0;
    const locked = entry.locked_for_forward || 0;
    if (available === 0 && locked > 0) {
      await this.erc20LedgerModel.updateOne(
        { walletAddress: entry.walletAddress, tokenAddress: entry.tokenAddress, chainId: entry.chainId },
        { $set: { available_balance: locked, locked_for_forward: 0 } }
      );
      available = locked;
    }
    if (available < tokenWithdrawDto.amount) {
      return { error: true, msg: 'Insufficient token balance' };
    }
    const wallet = wallets.find(w => w.address.toLowerCase() === entry.walletAddress);
    if (!wallet) {
      return { error: true, msg: 'Wallet not found' };
    }
    const tokenInfo = getTokenInfo(tokenWithdrawDto.tokenAddress);
    const transaction = new this.transactionModel({
      nature: 2,
      amount: -1 * tokenWithdrawDto.amount,
      created_at: Date.now(),
      status: 1,
      txHash: uuidv4(),
      to: tokenWithdrawDto.to
    });
    const saved = await transaction.save();
    if (!saved) {
      return { error: true, msg: 'Failed to create transaction' };
    }
    await this.transactionStatusQueue.add('status-update', {
      transactionId: transaction._id.toString(),
      status: transaction.status,
      confirmations: transaction.confirmations ?? 0,
      source: 'app-core-withdraw-token'
    }, { removeOnComplete: true, removeOnFail: 50 });
    await this.withdrawTokenQueue.add('request', {
      transactionId: transaction._id.toString(),
      walletAddress: entry.walletAddress,
      tokenAddress: tokenWithdrawDto.tokenAddress.toLowerCase(),
      chainId: entry.chainId,
      amount: tokenWithdrawDto.amount,
      withdrawAddress: tokenWithdrawDto.to,
      symbol: tokenInfo?.symbol || 'UNKNOWN',
      deductLocked: Math.min(tokenWithdrawDto.amount, locked)
    });
    return { error: null, data: 'success', transactionId: transaction._id.toString() };
  }
}
