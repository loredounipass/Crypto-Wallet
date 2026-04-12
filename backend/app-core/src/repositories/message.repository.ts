import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { AppMessage, AppMessageDocument } from '../messages-and-multimedia/schemas/message.schema';

@Injectable()
export class MessageRepository {
  constructor(@InjectModel(AppMessage.name) private readonly messageModel: Model<AppMessageDocument>) {}

  find(filter: any): Query<any, any> {
    return this.messageModel.find(filter);
  }

  findById(id: string): Query<any, any> {
    return this.messageModel.findById(id);
  }

  findByIdAndUpdate(id: string, update: any, options?: any): Query<any, any> {
    return this.messageModel.findByIdAndUpdate(id, update, options);
  }

  create(docs: any): any {
    return this.messageModel.create(docs);
  }

  updateOne(filter: any, update: any): Query<any, any> {
    return this.messageModel.updateOne(filter, update);
  }
}
