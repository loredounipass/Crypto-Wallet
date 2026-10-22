import { Injectable, Logger } from '@nestjs/common';
import { COINBASE_BASE_URL, DEFAULT_HTTP_TIMEOUT_MS, DEFAULT_MAX_RETRIES, DEFAULT_RETRY_BASE_DELAY_MS, MAX_RETRY_DELAY_MS, readIntEnv } from './price.constants';

export class CoinbaseUnavailableError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'CoinbaseUnavailableError';
  }
}

export interface CoinbaseTicker {
  price: string;
  bid: string;
  ask: string;
  volume: string;
  trade_id: number;
  time: string;
  last_size: string;
}

export interface CoinbaseCandle {
  time: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

@Injectable()
export class CoinbasePriceClient {
  private readonly logger = new Logger(CoinbasePriceClient.name);
  private readonly baseUrl = COINBASE_BASE_URL;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;

  constructor() {
    this.timeoutMs = readIntEnv('PRICE_HTTP_TIMEOUT_MS', DEFAULT_HTTP_TIMEOUT_MS);
    this.maxRetries = readIntEnv('PRICE_MAX_RETRIES', DEFAULT_MAX_RETRIES);
    this.retryBaseDelayMs = readIntEnv('PRICE_RETRY_BASE_DELAY_MS', DEFAULT_RETRY_BASE_DELAY_MS);
  }

  async getTicker(productId: string): Promise<CoinbaseTicker> {
    const path = `/products/${encodeURIComponent(productId)}/ticker`;
    return this.request<CoinbaseTicker>(path);
  }

  async getCandles(productId: string, granularity = 3600, limit = 24): Promise<CoinbaseCandle[]> {
    const path = `/products/${encodeURIComponent(productId)}/candles?granularity=${granularity}&limit=${limit}`;
    const raw = await this.request<any[]>(path);
    return raw.map((c: number[]) => ({
      time: c[0],
      low: c[1],
      high: c[2],
      open: c[3],
      close: c[4],
      volume: c[5],
    })).reverse();
  }

  private async request<T>(path: string): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: 'GET',
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        const retryable = response.status === 429 || response.status >= 500;
        const error = new CoinbaseUnavailableError(`Coinbase respondio ${response.status} ${response.statusText}`, response.status);
        if (!retryable || attempt >= this.maxRetries) throw error;
        await this.sleep(this.retryDelay(attempt));
      } catch (error) {
        if (error instanceof CoinbaseUnavailableError) throw error;
        lastError = error as Error;
        if (attempt >= this.maxRetries) break;
        this.logger.warn(`Coinbase fallo (intento ${attempt + 1}/${this.maxRetries + 1}): ${lastError.message}`);
        await this.sleep(this.retryDelay(attempt));
      }
    }
    throw new CoinbaseUnavailableError(lastError?.message || 'Coinbase no respondio correctamente');
  }

  private retryDelay(attempt: number): number {
    const exponential = this.retryBaseDelayMs * 2 ** attempt;
    const jitter = Math.floor(Math.random() * 100);
    return Math.min(exponential + jitter, MAX_RETRY_DELAY_MS);
  }

  private sleep(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
