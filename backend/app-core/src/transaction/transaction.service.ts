import { Injectable } from '@nestjs/common';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import { QueryDto } from './dto/query.dto';


// This service handles operations related to transactions, such as retrieving specific transactions and fetching all transactions for a user based on their email and the specified coin.
@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>
  ) { }


  // Get a specific transaction by its ID
  async getTransaction(queryDto: QueryDto) {
    const data = await this.transactionModel.findOne(
      { _id: new Types.ObjectId(queryDto.transactionId) },
      { _id: 0, __v: 0 }
    ).exec();

    if (data) {
      return data;
    }
  }


  // Get all transactions for a user based on their email and the specified coin
  async getTransactions(email: string, queryDto: QueryDto) {
    const data = await this.userModel.aggregate([
      { $match: { email } },
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
              $match: { coin: queryDto.coin }
            }
          ]
        }
      }
    ]).exec();

    if (data && data.length > 0) {
      let wallet = data.find(w => w.walletsData.length > 0);
      if (wallet) {
        wallet = wallet.walletsData[0];
        const data = await this.walletModel.aggregate([
          { $match: { _id: new Types.ObjectId(wallet._id) } },
          { $unwind: '$transactions' },
          { $project: { _id: 0, transactions: 1 } },
          {
            $lookup: {
              from: "transactions",
              localField: "transactions",
              foreignField: "_id",
              as: "transactionData"
            }
          }
        ]).exec();

        if (data && data.length > 0) {
          return data.map(transaction => {
            const tx = transaction.transactionData[0];
            return {
              nature: tx.nature,
              txHash: tx.txHash,
              transactionId: tx._id,
              created_at: tx.created_at,
              confirmations: tx.confirmations,
              status: tx.status,
              amount: tx.amount,
              to: tx.to,
              coin: wallet.coin,
              chainId: wallet.chainId
            }
          })
        }
      }
    }
  }

}
