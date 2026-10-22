import { PriceService } from './price.service';

describe('PriceService', () => {
  let service: PriceService;
  let redis: { get: jest.Mock; setEx: jest.Mock; del: jest.Mock };
  let binance: { getTickerPrice: jest.Mock; getTickerPrices: jest.Mock; getKlines: jest.Mock };

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      setEx: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    binance = {
      getTickerPrice: jest.fn(),
      getTickerPrices: jest.fn(),
      getKlines: jest.fn(),
    };
    service = new PriceService(redis as any, binance as any);
  });

  it('devuelve el valor cacheado sin llamar a Binance', async () => {
    redis.get.mockImplementation(async (key: string) =>
      key === 'price:ETHUSDT' ? JSON.stringify({ USD: 2500 }) : null,
    );

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 2500 });
    expect(binance.getTickerPrice).not.toHaveBeenCalled();
  });

  it('consulta Binance y escribe cache fresca y stale en un cache miss', async () => {
    binance.getTickerPrice.mockResolvedValue({ symbol: 'ETHUSDT', price: '2500' });

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 2500 });

    expect(binance.getTickerPrice).toHaveBeenCalledWith('ETHUSDT');
    expect(redis.setEx).toHaveBeenCalledWith('price:ETHUSDT', 60, JSON.stringify({ USD: 2500 }));
    expect(redis.setEx).toHaveBeenCalledWith('price:stale:ETHUSDT', 86400, JSON.stringify({ USD: 2500 }));
    expect(redis.del).toHaveBeenCalledWith('price:degraded:ETHUSDT');
  });

  it('sirve el valor stale cuando Binance falla', async () => {
    redis.get.mockImplementation(async (key: string) =>
      key === 'price:stale:ETHUSDT' ? JSON.stringify({ USD: 1900 }) : null,
    );
    binance.getTickerPrice.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 1900 });
  });

  it('aplica fallback de 1 USD a stablecoins sin precio ni stale', async () => {
    binance.getTickerPrice.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPrice('USDT')).resolves.toEqual({ USD: 1 });
    expect(redis.setEx).toHaveBeenCalledWith('price:degraded:USDTUSDT', 30, JSON.stringify({ USD: 1 }));
  });

  it('aplica fallback de 0 a monedas sin precio ni stale', async () => {
    binance.getTickerPrice.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 0 });
  });

  it('ignora valores cacheados invalidos (el antiguo {USD:0})', async () => {
    redis.get.mockImplementation(async (key: string) =>
      key === 'price:USDTUSDT' ? JSON.stringify({ USD: 0 }) : null,
    );
    binance.getTickerPrice.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPrice('USDT')).resolves.toEqual({ USD: 1 });
  });

  it('no llama a Binance con identificadores invalidos o no soportados', async () => {
    await expect(service.getPrice('BADCOIN')).resolves.toEqual({ USD: 0 });
    expect(binance.getTickerPrice).not.toHaveBeenCalled();
    await expect(service.getPrice('BTC')).resolves.toEqual({ USD: 0 });
    expect(binance.getTickerPrice).not.toHaveBeenCalled();
  });

  it('continua funcionando si Redis falla', async () => {
    redis.get.mockRejectedValue(new Error('redis down'));
    redis.setEx.mockRejectedValue(new Error('redis down'));
    redis.del.mockRejectedValue(new Error('redis down'));
    binance.getTickerPrice.mockResolvedValue({ symbol: 'ETHUSDT', price: '2000' });

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 2000 });
  });

  it('colapsa peticiones concurrentes de la misma moneda (single-flight)', async () => {
    let resolveFetch: (value: unknown) => void;
    binance.getTickerPrice.mockReturnValue(
      new Promise((resolve) => { resolveFetch = resolve; }),
    );

    const first = service.getPrice('ETH');
    const second = service.getPrice('ETH');
    await new Promise((resolve) => setImmediate(resolve));
    resolveFetch!({ symbol: 'ETHUSDT', price: '2000' });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { USD: 2000 },
      { USD: 2000 },
    ]);
    expect(binance.getTickerPrice).toHaveBeenCalledTimes(1);
  });

  it('transforma las klines en un arreglo de precios', async () => {
    binance.getKlines.mockResolvedValue([
      { close: '100', open: '99', high: '101', low: '98', openTime: 1, closeTime: 2, volume: '0', quoteAssetVolume: '0', numberOfTrades: '0', takerBuyBaseAssetVolume: '0', takerBuyQuoteAssetVolume: '0' },
      { close: '101', open: '100', high: '102', low: '99', openTime: 1, closeTime: 2, volume: '0', quoteAssetVolume: '0', numberOfTrades: '0', takerBuyBaseAssetVolume: '0', takerBuyQuoteAssetVolume: '0' },
    ]);

    await expect(service.getChart('ETH')).resolves.toEqual({ prices: [100, 101] });
    expect(redis.setEx).toHaveBeenCalledWith('chart:ETHUSDT', 300, JSON.stringify({ prices: [100, 101] }));
  });

  it('devuelve el contrato de la landing usando Binance', async () => {
    binance.getTickerPrices.mockResolvedValue([
      { symbol: 'BNBUSDT', price: '300' },
      { symbol: 'ETHUSDT', price: '2500' },
      { symbol: 'AVAXUSDT', price: '25' },
      { symbol: 'MATICUSDT', price: '0.6' },
    ]);

    await expect(service.getLanding()).resolves.toEqual({
      bnb: { usd: 300 },
      eth: { usd: 2500 },
      avax: { usd: 25 },
      matic: { usd: 0.6 },
    });
    expect(binance.getTickerPrices).toHaveBeenCalledTimes(1);
  });

  it('resuelve simbolos de Binance y rechaza entradas invalidas', () => {
    expect(service.resolveBinanceSymbol('ETH')).toBe('ETHUSDT');
    expect(service.resolveBinanceSymbol('usdt')).toBe('USDTUSDT');
    expect(service.resolveBinanceSymbol('ETH ')).toBe('ETHUSDT');
    expect(service.resolveBinanceSymbol('BTC')).toBeNull();
    expect(service.resolveBinanceSymbol('bad coin')).toBeNull();
  });
});
