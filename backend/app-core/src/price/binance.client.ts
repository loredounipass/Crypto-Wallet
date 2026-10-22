import { Injectable, Logger } from '@nestjs/common';
import { BINANCE_BASE_URL, DEFAULT_HTTP_TIMEOUT_MS, DEFAULT_MAX_RETRIES, DEFAULT_RETRY_BASE_DELAY_MS, MAX_RETRY_DELAY_MS, readIntEnv } from './price.constants';

export class BinanceUnavailableError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'BinanceUnavailableError';
  }
}

export interface BinanceTickerPrice {
  symbol: string;
  price: string;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: string;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

@Injectable()
export class BinancePriceClient {
  private readonly logger = new Logger(BinancePriceClient.name);
  private readonly baseUrl = BINANCE_BASE_URL;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;

  constructor() {
    this.timeoutMs = readIntEnv('PRICE_HTTP_TIMEOUT_MS', DEFAULT_HTTP_TIMEOUT_MS);
    this.maxRetries = readIntEnv('PRICE_MAX_RETRIES', DEFAULT_MAX_RETRIES);
    this.retryBaseDelayMs = readIntEnv('PRICE_RETRY_BASE_DELAY_MS', DEFAULT_RETRY_BASE_DELAY_MS);
  }

  async getTickerPrice(symbol: string): Promise<BinanceTickerPrice> {
    const path = `/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`;
    return this.request<BinanceTickerPrice>(path);
  }

  async getTickerPrices(): Promise<BinanceTickerPrice[]> {
    const path = '/api/v3/ticker/price';
    return this.request<BinanceTickerPrice[]>(path);
  }

  async getKlines(symbol: string, interval = '1h', limit = 24): Promise<BinanceKline[]> {
    const path = `/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
    const raw = await this.request<any[]>(path);
    return raw.map((k) => ({
      openTime: Number(k[0]),
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: k[5],
      closeTime: Number(k[6]),
      quoteAssetVolume: k[7],
      numberOfTrades: k[8],
      takerBuyBaseAssetVolume: k[9],
      takerBuyQuoteAssetVolume: k[10],
    }));
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
        const error = new BinanceUnavailableError(`Binance respondio ${response.status} ${response.statusText}`, response.status);
        if (!retryable || attempt >= this.maxRetries) throw error;
        await this.sleep(this.retryDelay(attempt));
      } catch (error) {
        if (error instanceof BinanceUnavailableError) throw error;
        lastError = error as Error;
        if (attempt >= this.maxRetries) break;
        this.logger.warn(`Binance fallo (intento ${attempt + 1}/${this.maxRetries + 1}): ${lastError.message}`);
        await this.sleep(this.retryDelay(attempt));
      }
    }
    throw new BinanceUnavailableError(lastError?.message || 'Binance no respondio correctamente');
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
