import { StorageProvider, StorageProviderResult } from './storage.provider';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'multimedia');

async function ensureDir() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
}

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor() {}

  async upload(buffer: Buffer, destinationKey: string, mimeType?: string): Promise<StorageProviderResult> {
    await ensureDir();
    // destinationKey may include folders; sanitize
    const key = destinationKey || `local/${crypto.randomUUID()}-${Math.random().toString(36).slice(2)}`;
    const outPath = path.join(UPLOAD_DIR, key.replace(/\//g, path.sep));
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    await fs.promises.writeFile(outPath, buffer);
    const url = `/uploads/multimedia/${key}`;
    return { key, url, size: buffer.length, mimeType };
  }

  async uploadStream(stream: NodeJS.ReadableStream, destinationKey: string, mimeType?: string): Promise<StorageProviderResult> {
    await ensureDir();
    const key = destinationKey || `local/${crypto.randomUUID()}-${Math.random().toString(36).slice(2)}`;
    const outPath = path.join(UPLOAD_DIR, key.replace(/\//g, path.sep));
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

  download(key: string): Promise<Buffer> {
    const p = path.join(UPLOAD_DIR, key.replace(/\//g, path.sep));
    return fsPromises.readFile(p);
  }

  downloadStream(key: string): NodeJS.ReadableStream {
    const p = path.join(UPLOAD_DIR, key.replace(/\//g, path.sep));
    return fs.createReadStream(p);
  }

  async delete(key: string): Promise<void> {
    const p = path.join(UPLOAD_DIR, key.replace(/\//g, path.sep));
    try { await fs.promises.unlink(p); } catch (_) {}
  }

  getPublicUrl(key: string): string {
    return `/uploads/multimedia/${key}`;
  }
}

export default {};
