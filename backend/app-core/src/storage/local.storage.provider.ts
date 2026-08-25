import { StorageProvider, StorageProviderResult } from './storage.provider';
import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'multimedia');



// VERIFICA QUE LA RUTA DEL ARCHIVO ESTE RESTRINGIDA AL DIRECTORIO DE CARGAS PARA EVITAR VULNERABILIDADES
function validatePath(filePath: string): void {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(UPLOAD_DIR)) {
    throw new BadRequestException('Invalid file path');
  }
}



// CREA EL DIRECTORIO DE ALMACENAMIENTO MULTIMEDIA SI ESTE NO EXISTE ACTUALMENTE EN EL SISTEMA DE ARCHIVOS
async function ensureDir() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
}

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor() {}



  // GUARDA EL ARCHIVO COMPLETO EN EL SISTEMA LOCAL Y DEVUELVE LA RUTA PUBLICA PARA SU ACCESO
  async upload(buffer: Buffer, destinationKey: string, mimeType?: string): Promise<StorageProviderResult> {
    await ensureDir();
    const key = destinationKey || `local/${crypto.randomUUID()}-${Math.random().toString(36).slice(2)}`;
    const outPath = path.resolve(UPLOAD_DIR, key.replace(/\//g, path.sep));
    validatePath(outPath);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    await fs.promises.writeFile(outPath, buffer);
    const url = `/uploads/multimedia/${key}`;
    return { key, url, size: buffer.length, mimeType };
  }



  // RECIBE UN FLUJO DE DATOS Y LO ESCRIBE PROGRESIVAMENTE EN EL DISCO PARA OPTIMIZAR EL CONSUMO DE MEMORIA
  async uploadStream(stream: NodeJS.ReadableStream, destinationKey: string, mimeType?: string): Promise<StorageProviderResult> {
    await ensureDir();
    const key = destinationKey || `local/${crypto.randomUUID()}-${Math.random().toString(36).slice(2)}`;
    const outPath = path.resolve(UPLOAD_DIR, key.replace(/\//g, path.sep));
    validatePath(outPath);
    await fsPromises.mkdir(path.dirname(outPath), { recursive: true });
    return await new Promise<StorageProviderResult>((resolve, reject) => {
      const writeStream = fs.createWriteStream(outPath);
      let size = 0;
      stream.on('data', (chunk: any) => { size += chunk.length; });
      stream.pipe(writeStream);
      writeStream.on('finish', () => {
        const url = `/uploads/multimedia/${key}`;
        resolve({ key, url, size, mimeType });
      });
      writeStream.on('error', (err) => reject(err));
      stream.on('error', (err) => reject(err));
    });
  }



  // LEE Y DEVUELVE EL CONTENIDO COMPLETO DE UN ARCHIVO ALMACENADO PREVIAMENTE EN EL SERVIDOR
  download(key: string): Promise<Buffer> {
    const p = path.resolve(UPLOAD_DIR, key.replace(/\//g, path.sep));
    validatePath(p);
    return fsPromises.readFile(p);
  }



  // CREA Y RETORNA UN FLUJO DE LECTURA PARA UN ARCHIVO ESPECIFICO PERMITIENDO SU DESCARGA PROGRESIVA
  downloadStream(key: string): NodeJS.ReadableStream {
    const p = path.resolve(UPLOAD_DIR, key.replace(/\//g, path.sep));
    validatePath(p);
    return fs.createReadStream(p);
  }



  // ELIMINA DEFINITIVAMENTE UN ARCHIVO DEL SISTEMA LOCAL Y MANEJA SILENCIOSAMENTE LOS ERRORES SI NO EXISTE
  async delete(key: string): Promise<void> {
    const p = path.resolve(UPLOAD_DIR, key.replace(/\//g, path.sep));
    validatePath(p);
    try { await fs.promises.unlink(p); } catch (_) {}
  }



  // CONSTRUYE Y RETORNA LA URL PUBLICA RELATIVA NECESARIA PARA ACCEDER A UN ARCHIVO ESPECIFICO
  getPublicUrl(key: string): string {
    return `/uploads/multimedia/${key}`;
  }
}

export default {};
