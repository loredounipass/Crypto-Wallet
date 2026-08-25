import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}



  // PERMITE ACCEDER AL MODELO DE USUARIO DIRECTAMENTE PARA REALIZAR OPERACIONES PERSONALIZADAS
  get model() {
    return this.userModel;
  }



  // BUSCA Y DEVUELVE UN DOCUMENTO DE USUARIO QUE CUMPLA EXACTAMENTE CON EL FILTRO PROPORCIONADO
  findOne(filter: any) {
    return this.userModel.findOne(filter).exec();
  }



  // RECUPERA EL REGISTRO DE UN USUARIO ESPECIFICO UTILIZANDO UNICAMENTE SU IDENTIFICADOR
  findById(id: string) {
    return this.userModel.findById(id).exec();
  }



  // INSERTA UN NUEVO USUARIO EN EL SISTEMA CON LOS DATOS PROPORCIONADOS DURANTE EL REGISTRO
  create(createUserData: any) {
    return this.userModel.create(createUserData);
  }



  // ENCUENTRA UN USUARIO MEDIANTE CONDICIONES Y ACTUALIZA SU INFORMACION EN UN SOLO PASO
  findOneAndUpdate(filter: any, update: any, options?: any) {
    return this.userModel.findOneAndUpdate(filter, update, options).exec();
  }



  // BUSCA A UN USUARIO POR SU ID Y ACTUALIZA SUS CAMPOS CON LA NUEVA INFORMACION SOLICITADA
  findByIdAndUpdate(id: string, update: any, options?: any) {
    return this.userModel.findByIdAndUpdate(id, update, options).exec();
  }



  // OBTIENE UNA LISTA COMPLETA DE TODOS LOS USUARIOS QUE COINCIDAN CON LOS CRITERIOS BUSCADOS
  find(filter: any) {
    return this.userModel.find(filter);
  }
}

export default UserRepository;
