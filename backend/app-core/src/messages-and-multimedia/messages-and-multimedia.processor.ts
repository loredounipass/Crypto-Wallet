import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LocalStorageProvider } from 'src/storage/local.storage.provider';
import { MultimediaRepository } from 'src/repositories/multimedia.repository';
import sharp from 'sharp';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { finished } from 'stream/promises';

@Processor('multimedia')
@Injectable()
export class MultimediaProcessor {
  constructor(
    private readonly storage: LocalStorageProvider,
    private readonly multimediaRepository: MultimediaRepository,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  private get multimediaModel() {
    return this.multimediaRepository;
  }

  @Process('process')
  async handle(job: Job) {
    const { stagingKey, multimediaId } = job.data;
    console.log(`[MultimediaProcessor] ▶ Job started | multimediaId=${multimediaId} | stagingKey=${stagingKey} | messageId=${job.data.messageId}`);

    // download object from storage provider (staging)
    // Prefer stream download when available to avoid buffering large files entirely in RAM
    const tmpDir = os.tmpdir();
    const baseName = `${crypto.randomUUID()}-${stagingKey.split('/').pop()}`;
    const tempIn = path.join(tmpDir, baseName);
    const hasDownloadStream = typeof (this.storage as any).downloadStream === 'function';
    if (hasDownloadStream) {
      // stream to temp file
      await fsPromises.mkdir(path.dirname(tempIn), { recursive: true }).catch(() => { });
      const read = (this.storage as any).downloadStream(stagingKey) as NodeJS.ReadableStream;
      const write = fs.createWriteStream(tempIn);
      read.pipe(write);
      await finished(write);
    } else {
      const buffer = await this.storage.download(stagingKey);
      await fsPromises.writeFile(tempIn, buffer);
    }

    // determine mime
    const mime = job.data.mimeType || 'application/octet-stream';
    console.log(`[MultimediaProcessor] 📁 File downloaded to temp | mime=${mime} | tempIn=${tempIn}`);


    try {
      // simple branching by mime
      let finalKey = `final/${crypto.randomUUID()}-${stagingKey.split('/').pop()}`;
      let thumbnailUrl: string | undefined;
      let metadata: any = {};

      if (mime.startsWith('image/')) {
        // process image from temp file to avoid buffering in memory
        const optName = `opt-${baseName}`;
        const optPath = path.join(tmpDir, optName);
        const thumbName = `thumb-${baseName}.jpg`;
        const thumbPath = path.join(tmpDir, thumbName);

        await sharp(tempIn).toFile(optPath);
        await sharp(tempIn).resize({ width: 200 }).toFile(thumbPath);
        const meta = await sharp(tempIn).metadata();
        metadata = { width: meta.width, height: meta.height, format: meta.format };
        console.log(`[MultimediaProcessor] 🖼️ Sharp processing done | width=${meta.width} height=${meta.height} format=${meta.format}`);

        // upload optimized and thumbnail using stream upload if available
        if (typeof (this.storage as any).uploadStream === 'function') {
          const optStream = fs.createReadStream(optPath);
          const uploadRes = await (this.storage as any).uploadStream(optStream, finalKey, mime);
          const thumbStream = fs.createReadStream(thumbPath);
          const thumbRes = await (this.storage as any).uploadStream(thumbStream, `thumbs/${crypto.randomUUID()}-${stagingKey.split('/').pop()}`, mime);
          thumbnailUrl = thumbRes.url;
          finalKey = uploadRes.key;
        } else {
          const optBuf = await fsPromises.readFile(optPath);
          const uploadRes = await this.storage.upload(optBuf, finalKey, mime);
          const thumbBuf = await fsPromises.readFile(thumbPath);
          const thumbRes = await this.storage.upload(thumbBuf, `thumbs/${crypto.randomUUID()}-${stagingKey.split('/').pop()}`, mime);
          thumbnailUrl = thumbRes.url;
          finalKey = uploadRes.key;
        }
        // cleanup temp files
        try { await fsPromises.unlink(optPath); } catch (_) { }
        try { await fsPromises.unlink(thumbPath); } catch (_) { }
      } else if (mime.startsWith('video/')) {
        // upload video without additional processing (just move from staging to final)
        let uploadRes;
        if (typeof (this.storage as any).uploadStream === 'function') {
          uploadRes = await (this.storage as any).uploadStream(fs.createReadStream(tempIn), finalKey, mime);
        } else {
          const buf = await fsPromises.readFile(tempIn);
          uploadRes = await this.storage.upload(buf, finalKey, mime);
        }
        metadata = {};
        try { await fsPromises.unlink(tempIn); } catch (_) { }
        finalKey = uploadRes.key;
      } else if (mime.startsWith('audio/')) {
        // upload audio without additional processing
        let uploadRes;
        if (typeof (this.storage as any).uploadStream === 'function') {
          uploadRes = await (this.storage as any).uploadStream(fs.createReadStream(tempIn), finalKey, mime);
        } else {
          const buf = await fsPromises.readFile(tempIn);
          uploadRes = await this.storage.upload(buf, finalKey, mime);
        }
        metadata = {};
        try { await fsPromises.unlink(tempIn); } catch (_) { }
        finalKey = uploadRes.key;
      }

      // Compute public URL
      const publicUrl = this.storage.getPublicUrl(finalKey);

      await this.multimediaModel.findByIdAndUpdate(multimediaId, {
        url: publicUrl,
        thumbnailUrl: thumbnailUrl,
        status: 'ready',
        ...metadata,
      }).exec();
      console.log(`[MultimediaProcessor] ✅ DB updated to ready | multimediaId=${multimediaId} | publicUrl=${publicUrl}`);

      // emit event so realtime clients can update (thumbnail, url, metadata)
      try {
        try { console.log(`[MultimediaProcessor] multimedia.ready url=${publicUrl} messageId=${job.data.messageId}`); } catch (_) { }
        void this.eventEmitter.emit('multimedia.ready', {
          multimediaId: multimediaId,
          messageId: job.data.messageId,
          url: publicUrl,
          thumbnailUrl: thumbnailUrl,
          metadata,
        });
      } catch (_) { }

      // delete staging
      try { await this.storage.delete(stagingKey); } catch (_) { }

    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error(`[MultimediaProcessor] ❌ Job FAILED | multimediaId=${multimediaId} | error=${e.message}`);
      const errorPayload: any = { status: 'failed' };
      try { errorPayload.lastError = e.message; } catch (_) { errorPayload.lastError = 'unknown'; }
      await this.multimediaModel.findByIdAndUpdate(multimediaId, errorPayload as any).exec();
      throw err;
    } finally {
      // ensure temp files are cleaned even on unexpected errors
      const candidates = [
        tempIn,
        path.join(tmpDir, `out-${baseName}.mp4`),
        path.join(tmpDir, `opt-${baseName}`),
        path.join(tmpDir, `thumb-${baseName}.jpg`),
      ];
      for (const p of candidates) {
        try { await fsPromises.unlink(p); } catch (_) { }
      }
    }

  }
}

export default {};
