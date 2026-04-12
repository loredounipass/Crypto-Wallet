import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  get model() {
    return this.userModel;
  }

  findOne(filter: any) {
    return this.userModel.findOne(filter).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  create(createUserData: any) {
    return this.userModel.create(createUserData);
  }

  findOneAndUpdate(filter: any, update: any, options?: any) {
    return this.userModel.findOneAndUpdate(filter, update, options).exec();
  }

  findByIdAndUpdate(id: string, update: any, options?: any) {
    return this.userModel.findByIdAndUpdate(id, update, options).exec();
  }

  find(filter: any) {
    return this.userModel.find(filter);
  }
}

export default UserRepository;
