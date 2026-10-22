import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import { BinancePriceClient } from './binance.client';
import {
  APP_COINS,
  BINANCE_SYMBOLS,
  DEFAULT_CHART_CACHE_TTL_SEC,
  DEFAULT_DEGRADED_CACHE_TTL_SEC,
  DEFAULT_PRICE_CACHE_TTL_SEC,
  DEFAULT_STALE_CACHE_TTL_SEC,
  LANDING_COIN_IDS,
  STABLECOIN_SYMBOLS,
  readBoolEnv,
  readIntEnv,
} from './price.constants';
import { ChartResponse, LandingPrices, PriceResponse } from './price.types';

interface CacheKeys {
  fresh: string;
  stale: string;
  degraded: string;
}

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly inFlight = new Map<string, Promise<unknown>>();

  private readonly priceTtl = readIntEnv('PRICE_CACHE_TTL_SEC', DEFAULT_PRICE_CACHE_TTL_SEC);
  private readonly chartTtl = readIntEnv('PRICE_CHART_CACHE_TTL_SEC', DEFAULT_CHART_CACHE_TTL_SEC);
  private readonly staleTtl = readIntEnv('PRICE_STALE_TTL_SEC', DEFAULT_STALE_CACHE_TTL_SEC);
  private readonly degradedTtl = readIntEnv('PRICE_DEGRADED_CACHE_TTL_SEC', DEFAULT_DEGRADED_CACHE_TTL_SEC);
  private readonly stablecoinFallbackEnabled = readBoolEnv('PRICE_STABLECOIN_FALLBACK', true);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: any,
    private readonly binance: BinancePriceClient,
  ) {}

  async getPrice(coin: string): Promise<PriceResponse> {
    const symbol = this.resolveBinanceSymbol(coin);
    if (!symbol) return { USD: 0 };

    return this.cached<PriceResponse>(
      this.buildKeys(`price:${symbol}`, `price:stale:${symbol}`, `price:degraded:${symbol}`),
      this.priceTtl,
      async () => {
        const data = await this.binance.getTickerPrice(symbol);
        const usd = Number(data?.price ?? 0);
        return { USD: Number.isFinite(usd) && usd > 0 ? usd : 0 };
      },
      (value) => Number.isFinite(value?.USD) && value.USD > 0,
      () => ({ USD: this.stablecoinFallback(symbol) }),
    );
  }

  async getChart(coin: string): Promise<ChartResponse> {
    const symbol = this.resolveBinanceSymbol(coin);
    if (!symbol) return { prices: [] };

    return this.cached<ChartResponse>(
      this.buildKeys(`chart:${symbol}`, `chart:stale:${symbol}`, `chart:degraded:${symbol}`),
      this.chartTtl,
      async () => {
        const klines = await this.binance.getKlines(symbol, '1h', 24);
        const prices = klines.map((k) => Number(k.close)).filter((v) => Number.isFinite(v));
        return { prices };
      },
      (value) => Array.isArray(value?.prices) && value.prices.length > 1,
      () => ({ prices: [] }),
    );
  }

  async getLanding(): Promise<LandingPrices> {
    const symbols = LANDING_COIN_IDS
      .map((c) => this.resolveBinanceSymbol(c))
      .filter(Boolean) as string[];

    if (symbols.length === 0) return {};

    return this.cached<LandingPrices>(
      this.buildKeys('price:landing', 'price:stale:landing', 'price:degraded:landing'),
      this.priceTtl,
      async () => {
        const all = await this.binance.getTickerPrices();
        const map: LandingPrices = {};
        for (const sym of symbols) {
          const item = all.find((p) => p.symbol === sym);
          if (item) {
            const coin = Object.keys(BINANCE_SYMBOLS).find((k) => BINANCE_SYMBOLS[k] === sym);
            if (coin) map[coin] = { usd: Number(item.price) || 0 };
          }
        }
        return map;
      },
      (value) => Boolean(value) && Object.keys(value).length > 0,
      () => ({}),
    );
  }

  async getUsd(coin: string): Promise<number> {
    const { USD } = await this.getPrice(coin);
    return USD;
  }

  resolveBinanceSymbol(coin: string): string | null {
    const key = String(coin ?? '').toLowerCase().trim();
    if (!/^[a-z0-9]{1,32}$/.test(key)) return null;
    if (!APP_COINS.includes(key as any)) return null;
    return BINANCE_SYMBOLS[key];
  }

  private async cached<T>(
    keys: CacheKeys,
    ttl: number,
    load: () => Promise<T>,
    isValid: (value: T) => boolean,
    degraded: () => T,
  ): Promise<T> {
    const fresh = await this.readJson<T>(keys.fresh);
    if (fresh !== null && isValid(fresh)) return fresh;

    const degradedCached = await this.readJson<T>(keys.degraded);
    if (degradedCached !== null) return degradedCached;

    const running = this.inFlight.get(keys.fresh) as Promise<T> | undefined;
    if (running) return running;

    const task = this.runCacheFlow(keys, ttl, load, isValid, degraded).finally(() => {
      this.inFlight.delete(keys.fresh);
    });

    this.inFlight.set(keys.fresh, task);
    return task;
  }

  private async runCacheFlow<T>(
    keys: CacheKeys,
    ttl: number,
    load: () => Promise<T>,
    isValid: (value: T) => boolean,
    degraded: () => T,
  ): Promise<T> {
    const fresh = await this.readJson<T>(keys.fresh);
    if (fresh !== null && isValid(fresh)) return fresh;

    const degradedCached = await this.readJson<T>(keys.degraded);
    if (degradedCached !== null) return degradedCached;

    try {
      const value = await load();
      if (isValid(value)) {
        await this.writeJson(keys.fresh, value, ttl);
        await this.writeJson(keys.stale, value, this.staleTtl);
        await this.delete(keys.degraded);
        return value;
      }
      const fallback = degraded();
      await this.writeJson(keys.degraded, fallback, this.degradedTtl);
      return fallback;
    } catch (error) {
      this.logger.warn(`Proveedor de precios no disponible: ${(error as Error).message}`);

      const stale = await this.readJson<T>(keys.stale);
      if (stale !== null && isValid(stale)) return stale;

      const fallback = degraded();
      await this.writeJson(keys.degraded, fallback, this.degradedTtl);
      return fallback;
    }
  }

  private buildKeys(fresh: string, stale: string, degraded: string): CacheKeys {
    return { fresh, stale, degraded };
  }

  private stablecoinFallback(symbol: string): number {
    return this.stablecoinFallbackEnabled && STABLECOIN_SYMBOLS.has(symbol) ? 1 : 0;
  }

  private async readJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.debug(`No se pudo leer ${key} de Redis: ${(error as Error).message}`);
      return null;
    }
  }

  private async writeJson<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.redis.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.debug(`No se pudo escribir ${key} en Redis: ${(error as Error).message}`);
    }
  }

  private async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.debug(`No se pudo borrar ${key} de Redis: ${(error as Error).message}`);
    }
  }
}
