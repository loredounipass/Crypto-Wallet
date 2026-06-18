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


// This service handles operations related to wallets, such as creating a new wallet for a user, retrieving wallet information, and processing withdrawal requests. It interacts with the User, Wallet, WalletContract, and Transaction models to perform these operations and uses a queue to handle withdrawal requests asynchronously.
@Injectable()
export class WalletService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletContract.name) private walletContractModel: Model<WalletContractDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Erc20Ledger.name) private erc20LedgerModel: Model<Erc20LedgerDocument>,
    @InjectQueue(QueueType.WITHDRAW_REQUEST) private withdrawQueue: Queue,
    @InjectQueue(QueueType.TRANSACTION_STATUS_EVENTS) private transactionStatusQueue: Queue,
    @InjectQueue(QueueType.WITHDRAW_TOKEN_REQUEST) private withdrawTokenQueue: Queue
  ) { }


  // Create a new wallet for a user based on the provided email, coin, and chainId. If the user already has a wallet for the specified coin and chainId, it returns the existing wallet information. Otherwise, it reserves a new wallet from the wallet contract collection, creates a new wallet document, and associates it with the user.
  async create(createWalletDto: CreateWalletDto) {
    let data = await this.userModel.aggregate([
      { $match: { email: createWalletDto.email } },
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
      // Reserve a pre-generated wallet contract atomically
      const contract = await this.walletContractModel.findOneAndUpdate(
        { chainId: createWalletDto.chainId, reserved: false },
        { reserved: true },
        { returnDocument: 'after' }
      );
      if (!contract) {
        throw new BadRequestException('No available wallet contracts for this chain.');
      }

      // Re-check: another concurrent request may have created a wallet
      // for this user+coin+chainId while we were reserving the contract.
      const reCheck = await this.userModel.aggregate([
        { $match: { email: createWalletDto.email } },
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
        // Another request beat us — unreserve our contract and return the existing wallet
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

      // Create wallet document. The unique index on `address` prevents
      // duplicate wallets at the database level.
      try {
        const wallet = new this.walletModel({
          address: contract.address,
          chainId: createWalletDto.chainId,
          coin: createWalletDto.coin
        });
        const saved = await wallet.save();

        const result = await this.userModel.updateOne(
          { email: createWalletDto.email },
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
        // $push didn't modify — user record not found or edge case
        throw new Error('Failed to link wallet to user.');
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key on `address` — another request already created this wallet.
          await this.walletContractModel.updateOne(
            { _id: contract._id },
            { reserved: false }
          ).catch(e => console.error('[WALLET] Failed to unreserve contract on duplicate:', e.message));

          const existingByAddress = await this.walletModel.findOne({ address: contract.address });
          if (existingByAddress) {
            // Ensure the user is linked to this wallet
            await this.userModel.updateOne(
              { email: createWalletDto.email, wallets: { $ne: existingByAddress._id } },
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


  // Get a specific wallet for a user based on their email, coin, and chainId. It retrieves the wallet information from the user's associated wallets and returns it if found.
  async getWallet(email: string, queryDto: QueryDto) {
    const data = await this.userModel.aggregate([
      { $match: { email } },
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


  // Get all wallets for a user based on their email. It retrieves the wallet information from the user's associated wallets and returns it as a list.
  async getWallets(email: string) {
    const data = await this.userModel.aggregate([
      { $match: { email } },
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


  // Process a withdrawal request for a user based on the provided email, coin, amount, and destination address. It checks if the user has sufficient balance in their wallet, creates a new transaction for the withdrawal, updates the wallet balance, and adds the withdrawal request to a queue for asynchronous processing.
  async withdraw(withdrawDto: WithdrawDto) {
    const data = await this.userModel.aggregate([
      { $match: { email: withdrawDto.email } },
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
        const data = await this.walletModel.findOne(
          { _id: new Types.ObjectId(wallet._id) },
          { _id: 0, transactions: 0, __v: 0 }
        ).exec();

        if (data && data.balance >= withdrawDto.amount) {
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

            const result = await this.walletModel.updateOne(
              { _id: new Types.ObjectId(wallet._id) },
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
          }
        } else {
          return {
            error: true,
            msg: 'Insuficient balance'
          };
        }

      }
    }
  }

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

    // Re-credit if a previous withdrawal failed (available === 0 but locked > 0)
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
