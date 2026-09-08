import { Injectable } from '@nestjs/common';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import { QueryDto } from './dto/query.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>
  ) { }



  // RECUPERA LOS DETALLES EXACTOS DE UNA TRANSACCION ESPECIFICA COMPROBANDO QUE PERTENEZCA A LA BILLETERA DEL USUARIO
  async getTransaction(email: string, queryDto: QueryDto) {
    const user = await this.userModel.findOne({ email }).populate({
      path: 'wallets',
      populate: { path: 'transactions', match: { _id: new Types.ObjectId(queryDto.transactionId) } }
    }).lean().exec();
    if (!user) return null;
    let tx = null;
    for (const w of (user.wallets as any[])) {
      const found = (w.transactions || []).find((t: any) => t._id.toString() === queryDto.transactionId);
      if (found) {
        tx = found;
        break;
      }
    }
    if (tx) {
      return {
        nature: tx.nature,
        txHash: tx.txHash,
        linkedTxHash: tx.linkedTxHash || null,
        transactionId: tx._id,
        created_at: tx.created_at,
        confirmations: tx.confirmations,
        status: tx.status,
        amount: tx.amount,
        fee: tx.fee || 0,
        to: tx.to,
        tokenSymbol: tx.tokenSymbol || null
      };
    }
  }



  // CONSULTA Y COMBINA LAS BILLETERAS DEL USUARIO PARA GENERAR LA LISTA COMPLETA DE TRANSACCIONES DE UNA MONEDA
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
              linkedTxHash: tx.linkedTxHash || null,
              transactionId: tx._id,
              created_at: tx.created_at,
              confirmations: tx.confirmations,
              status: tx.status,
              amount: tx.amount,
              fee: tx.fee || 0,
              to: tx.to,
              tokenSymbol: tx.tokenSymbol || null,
              coin: wallet.coin,
              chainId: wallet.chainId
            }
          })
        }
      }
    }
  }
}
