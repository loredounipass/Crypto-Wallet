import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { Multimedia, MultimediaDocument } from '../messages-and-multimedia/schemas/multimedia.schema';

@Injectable()
export class MultimediaRepository {
  constructor(@InjectModel(Multimedia.name) private readonly multimediaModel: Model<MultimediaDocument>) {}

  get model() {
    return this.multimediaModel;
  }

  find(filter: any): Query<any, any> {
    return this.multimediaModel.find(filter);
  }

  findById(id: string): Query<any, any> {
    return this.multimediaModel.findById(id).lean();
  }

  findByIdAndUpdate(id: string, update: any, options?: any): Query<any, any> {
    return this.multimediaModel.findByIdAndUpdate(id, update, options);
  }

  create(docs: any): any {
    return this.multimediaModel.create(docs);
  }

  updateOne(filter: any, update: any, options?: any): Query<any, any> {
    return this.multimediaModel.updateOne(filter, update, options);
  }

  deleteOne(filter: any): Query<any, any> {
    return this.multimediaModel.deleteOne(filter);
  }
}

export default MultimediaRepository;
