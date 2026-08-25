import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Query } from 'mongoose';
import { Profile, ProfileDocument } from '../profile/schemas/profile.schema';

@Injectable()
export class ProfileRepository {
  constructor(@InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>) {}



  // RECUPERA UN PERFIL DE USUARIO ESPECIFICO Y LO RETORNA COMO UN OBJETO DE JAVASCRIPT PLANO
  findOne(filter: any): Query<any, any> {
    return this.profileModel.findOne(filter).lean();
  }



  // BUSCA UN PERFIL A PARTIR DE UN FILTRO Y LO ACTUALIZA INMEDIATAMENTE CON LOS NUEVOS DATOS
  findOneAndUpdate(filter: any, update: any, options?: any): Query<any, any> {
    return this.profileModel.findOneAndUpdate(filter, update, options);
  }



  // OBTIENE MULTIPLES PERFILES QUE COINCIDAN CON LOS CRITERIOS PROPORCIONADOS EN LA CONSULTA
  find(filter: any): Query<any, any> {
    return this.profileModel.find(filter);
  }



  // BORRA UN SOLO PERFIL DE LA COLECCION QUE CUMPLA CON LA CONDICION DE BUSQUEDA
  deleteOne(filter: any): Query<any, any> {
    return this.profileModel.deleteOne(filter);
  }



  // ELIMINA SIMULTANEAMENTE TODOS LOS PERFILES DE LA BASE DE DATOS QUE COINCIDAN CON EL FILTRO
  deleteMany(filter: any): Query<any, any> {
    return this.profileModel.deleteMany(filter);
  }
}

export default ProfileRepository;
