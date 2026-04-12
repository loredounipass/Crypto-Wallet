import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token } from '../two-factor/schemas/verification.schema';

@Injectable()
export class TokenRepository {
  constructor(@InjectModel('Token') private readonly tokenModel: Model<Token>) {}

  findOne(filter: any) {
    return this.tokenModel.findOne(filter).exec();
  }

  findOneAndUpdate(filter: any, update: any, options?: any) {
    return this.tokenModel.findOneAndUpdate(filter, update, options).exec();
  }

  create(data: any) {
    return this.tokenModel.create(data);
  }
}

export default TokenRepository;
