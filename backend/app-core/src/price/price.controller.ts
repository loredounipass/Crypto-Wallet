import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Public } from '../guard/auth/public.decorator';
import { REDIS_CLIENT } from '../redis/redis.module';

const TTL_SEC = 60;
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

  constructor(@Inject(REDIS_CLIENT) private readonly redis: any) {}



  // NORMALIZA EL SIMBOLO DE LA CRIPTOMONEDA PARA QUE COINCIDA EXACTAMENTE CON EL IDENTIFICADOR DE COINGECKO
  private getCoinId(coin: string): string {
    const key = coin.toLowerCase().trim();
    return this.coinIds[key] || key;
  }



  // OBTIENE EL PRECIO ACTUAL DE UNA MONEDA DESDE EL CACHE O HACE LA PETICION A LA API SI ESTE YA EXPIRO
  @Public()
  @Get(':coin')
  async getPrice(@Param('coin') coin: string) {
    const id = this.getCoinId(coin);
    const cacheKey = `price:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const res = await fetch(priceApi.replace('%ID%', id));
    if (!res.ok) return { USD: 0 };
    const data: any = await res.json();
    const usd = data?.[id]?.usd ?? 0;
    const result = { USD: usd };
    await this.redis.setEx(cacheKey, TTL_SEC, JSON.stringify(result));
    return result;
  }



  // SOLICITA Y ALMACENA EL HISTORIAL DE PRECIOS DE LAS ULTIMAS VEINTICUATRO HORAS PARA DIBUJAR LA GRAFICA
  @Public()
  @Get(':coin/chart')
  async getChart(@Param('coin') coin: string) {
    const id = this.getCoinId(coin);
    const cacheKey = `chart:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const res = await fetch(chartApi.replace('%ID%', id));
    if (!res.ok) return { prices: [] };
    const data: any = await res.json();
    const prices = (data?.prices ?? []).map((p: number[]) => p[1]);
    const result = { prices };
    await this.redis.setEx(cacheKey, TTL_SEC, JSON.stringify(result));
    return result;
  }



  // CARGA LOS PRECIOS Y PORCENTAJES DE CAMBIO DE LAS MONEDAS PRINCIPALES PARA MOSTRARLOS EN LA PAGINA DE INICIO
  @Public()
  @Get('landing')
  async getLandingPrices() {
    const cached = await this.redis.get('price:landing');
    if (cached) return JSON.parse(cached);
    const res = await fetch(landingApi);
    if (!res.ok) return {};
    const data = await res.json();
    await this.redis.setEx('price:landing', TTL_SEC, JSON.stringify(data));
    return data;
  }
}
