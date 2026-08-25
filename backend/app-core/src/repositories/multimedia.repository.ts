import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { Multimedia, MultimediaDocument } from '../messages-and-multimedia/schemas/multimedia.schema';

@Injectable()
export class MultimediaRepository {
  constructor(@InjectModel(Multimedia.name) private readonly multimediaModel: Model<MultimediaDocument>) {}



  // EXPONE EL MODELO DE MONGOOSE ORIGINAL PARA CONSULTAS PERSONALIZADAS Y OPERACIONES AVANZADAS DIRECTAS
  get model() {
    return this.multimediaModel;
  }



  // RECUPERA UNA LISTA DE DOCUMENTOS MULTIMEDIA QUE CUMPLAN CON LAS CONDICIONES DE BUSQUEDA
  find(filter: any): Query<any, any> {
    return this.multimediaModel.find(filter);
  }



  // DEVUELVE UN ARCHIVO MULTIMEDIA BUSCANDOLO POR SU ID Y OPTIMIZANDO LA RESPUESTA CON LEAN
  findById(id: string): Query<any, any> {
    return this.multimediaModel.findById(id).lean();
  }



  // LOCALIZA UN REGISTRO MULTIMEDIA POR SU IDENTIFICADOR Y LO MODIFICA EN UNA SOLA OPERACION
  findByIdAndUpdate(id: string, update: any, options?: any): Query<any, any> {
    return this.multimediaModel.findByIdAndUpdate(id, update, options);
  }



  // INSERTA UNO O VARIOS REGISTROS DE ARCHIVOS MULTIMEDIA NUEVOS EN LA COLECCION CORRESPONDIENTE
  create(docs: any): any {
    return this.multimediaModel.create(docs);
  }



  // MODIFICA UNICAMENTE EL PRIMER DOCUMENTO MULTIMEDIA QUE SATISFAGA LOS CRITERIOS DEL FILTRO
  updateOne(filter: any, update: any, options?: any): Query<any, any> {
    return this.multimediaModel.updateOne(filter, update, options);
  }



  // ELIMINA DE LA BASE DE DATOS UN UNICO DOCUMENTO MULTIMEDIA SEGUN EL FILTRO ESPECIFICADO
  deleteOne(filter: any): Query<any, any> {
    return this.multimediaModel.deleteOne(filter);
  }
}

export default MultimediaRepository;
