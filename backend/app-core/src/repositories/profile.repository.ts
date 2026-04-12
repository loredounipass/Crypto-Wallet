import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Query } from 'mongoose';
import { Profile, ProfileDocument } from '../profile/schemas/profile.schema';

@Injectable()
export class ProfileRepository {
  constructor(@InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>) {}

  findOne(filter: any): Query<any, any> {
    return this.profileModel.findOne(filter).lean();
  }

  findOneAndUpdate(filter: any, update: any, options?: any): Query<any, any> {
    return this.profileModel.findOneAndUpdate(filter, update, options);
  }

  find(filter: any): Query<any, any> {
    return this.profileModel.find(filter);
  }

  deleteOne(filter: any): Query<any, any> {
    return this.profileModel.deleteOne(filter);
  }

  deleteMany(filter: any): Query<any, any> {
    return this.profileModel.deleteMany(filter);
  }
}

export default ProfileRepository;
