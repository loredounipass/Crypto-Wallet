import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token } from './schemas/verification.schema';

@Injectable()
export class TokenRepository {
  constructor(@InjectModel('Token') private readonly tokenModel: Model<Token>) {}



  // BUSCA UN TOKEN DE VERIFICACION ESPECIFICO Y EJECUTA LA CONSULTA EN LA BASE DE DATOS
  findOne(filter: any) {
    return this.tokenModel.findOne(filter).exec();
  }



  // LOCALIZA UN TOKEN MEDIANTE UN FILTRO Y LO ACTUALIZA DEVOLVIENDO EL RESULTADO INMEDIATAMENTE
  findOneAndUpdate(filter: any, update: any, options?: any) {
    return this.tokenModel.findOneAndUpdate(filter, update, options).exec();
  }



  // CREA Y ALMACENA UN NUEVO TOKEN DE VERIFICACION CON LOS DATOS PROPORCIONADOS POR EL USUARIO
  create(data: any) {
    return this.tokenModel.create(data);
  }
}

export default TokenRepository;
