import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../guard/auth/public.decorator';

const cache = new Map<string, { data: any; ts: number }>();
const TTL = 10_000; // 10 seconds

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

const priceApi = 'https://api.coingecko.com/api/v3/simple/price?ids=%ID%&vs_currencies=usd';
const chartApi = 'https://api.coingecko.com/api/v3/coins/%ID%/market_chart?vs_currency=usd&days=1';
const landingApi = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true';

@Controller('price')
export class PriceController {
  private readonly coinIds: Record<string, string> = {
    bnb: 'binancecoin',
    avax: 'avalanche-2',
    ftm: 'fantom',
    eth: 'ethereum',
    matic: 'matic-network',
    op: 'optimism',
  };

  private getCoinId(coin: string): string {
    const key = coin.toLowerCase().trim();
    return this.coinIds[key] || key;
  }

  @Public()
  @Get(':coin')
  async getPrice(@Param('coin') coin: string) {
    const id = this.getCoinId(coin);
    const cached = getCached(id);
    if (cached) return cached;

    const res = await fetch(priceApi.replace('%ID%', id));
    if (!res.ok) return { USD: 0 };
    const data: any = await res.json();
    const usd = data?.[id]?.usd ?? 0;
    const result = { USD: usd };
    setCache(id, result);
    return result;
  }

  @Public()
  @Get(':coin/chart')
  async getChart(@Param('coin') coin: string) {
    const id = this.getCoinId(coin);
    const key = `chart:${id}`;
    const cached = getCached(key);
    if (cached) return cached;

    const res = await fetch(chartApi.replace('%ID%', id));
    if (!res.ok) return { prices: [] };
    const data: any = await res.json();
    const prices = (data?.prices ?? []).map((p: number[]) => p[1]);
    const result = { prices };
    setCache(key, result);
    return result;
  }

  @Public()
  @Get('landing')
  async getLandingPrices() {
    const cached = getCached('landing');
    if (cached) return cached;

    const res = await fetch(landingApi);
    if (!res.ok) return {};
    const data = await res.json();
    setCache('landing', data);
    return data;
  }
}
