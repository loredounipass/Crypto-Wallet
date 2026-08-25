import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HashService {


  // COMPARA UNA CONTRASENA EN TEXTO PLANO CON SU HASH ENCRIPTADO PARA VALIDAR QUE COINCIDAN EXACTAMENTE
  async comparePassword(password: string, hash: string) {
      return await bcrypt.compare(password, hash)
  }



  // ENCRIPTA UNA CONTRASENA DE FORMA SEGURA UTILIZANDO EL ALGORITMO BCRYPT CON DOCE RONDAS DE COMPLEJIDAD
  async hashPassword(password: string) {
      return await bcrypt.hash(password, 12);
  }
}