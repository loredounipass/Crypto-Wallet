import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../guard/auth/public.decorator';

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
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
    );
    if (!res.ok) return { USD: 0 };
    const data: any = await res.json();
    const usd = data?.[id]?.usd ?? 0;
    return { USD: usd };
  }

  @Public()
  @Get(':coin/chart')
  async getChart(@Param('coin') coin: string) {
    const id = this.getCoinId(coin);
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1`,
    );
    if (!res.ok) return { prices: [] };
    const data: any = await res.json();
    const prices = (data?.prices ?? []).map((p: number[]) => p[1]);
    return { prices };
  }

  @Public()
  @Get('landing')
  async getLandingPrices() {
    const ids = 'bitcoin,ethereum,solana,binancecoin';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    );
    if (!res.ok) return {};
    return res.json();
  }
}
