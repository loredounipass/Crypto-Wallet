export interface StorageProviderResult {
  key: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, destinationKey: string, mimeType?: string): Promise<StorageProviderResult>;
  download(key: string): Promise<Buffer>;
  // Optional stream-based operations to avoid buffering large files in memory
  uploadStream?(stream: NodeJS.ReadableStream, destinationKey: string, mimeType?: string): Promise<StorageProviderResult>;
  downloadStream?(key: string): NodeJS.ReadableStream;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export default {};
