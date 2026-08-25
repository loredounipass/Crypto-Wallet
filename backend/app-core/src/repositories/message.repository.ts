import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { AppMessage, AppMessageDocument } from '../messages-and-multimedia/schemas/message.schema';

@Injectable()
export class MessageRepository {
  constructor(@InjectModel(AppMessage.name) private readonly messageModel: Model<AppMessageDocument>) {}



  // BUSCA Y RECUPERA MULTIPLES MENSAJES DE LA BASE DE DATOS QUE CUMPLAN CON EL FILTRO ESPECIFICADO
  find(filter: any): Query<any, any> {
    return this.messageModel.find(filter);
  }



  // OBTIENE UN MENSAJE ESPECIFICO MEDIANTE SU IDENTIFICADOR UNICO EN LA COLECCION
  findById(id: string): Query<any, any> {
    return this.messageModel.findById(id);
  }



  // BUSCA UN MENSAJE POR SU ID Y ACTUALIZA SUS DATOS APLICANDO LOS CAMBIOS SOLICITADOS
  findByIdAndUpdate(id: string, update: any, options?: any): Query<any, any> {
    return this.messageModel.findByIdAndUpdate(id, update, options);
  }



  // CREA Y GUARDA UN NUEVO DOCUMENTO DE MENSAJE O VARIOS SIMULTANEAMENTE EN LA BASE DE DATOS
  create(docs: any): any {
    return this.messageModel.create(docs);
  }



  // ACTUALIZA EL PRIMER MENSAJE QUE COINCIDA CON EL FILTRO UTILIZANDO LOS VALORES PROPORCIONADOS
  updateOne(filter: any, update: any): Query<any, any> {
    return this.messageModel.updateOne(filter, update);
  }
}
