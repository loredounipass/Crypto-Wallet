import { PriceService } from './price.service';

describe('PriceService', () => {
  let service: PriceService;
  let redis: { get: jest.Mock; setEx: jest.Mock; del: jest.Mock };
  let coinbase: { getTicker: jest.Mock; getCandles: jest.Mock };

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      setEx: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    coinbase = {
      getTicker: jest.fn(),
      getCandles: jest.fn(),
    };
    service = new PriceService(redis as any, coinbase as any);
  });

  it('devuelve el valor cacheado sin llamar a Coinbase', async () => {
    redis.get.mockImplementation(async (key: string) =>
      key === 'price:ETH-USD' ? JSON.stringify({ USD: 2500 }) : null,
    );

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 2500 });
    expect(coinbase.getTicker).not.toHaveBeenCalled();
  });

  it('consulta Coinbase y escribe cache fresca y stale en un cache miss', async () => {
    coinbase.getTicker.mockResolvedValue({ price: '2500', bid: '2499', ask: '2501', volume: '1', trade_id: 1, time: '', last_size: '0' });

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 2500 });

    expect(coinbase.getTicker).toHaveBeenCalledWith('ETH-USD');
    expect(redis.setEx).toHaveBeenCalledWith('price:ETH-USD', 60, JSON.stringify({ USD: 2500 }));
    expect(redis.setEx).toHaveBeenCalledWith('price:stale:ETH-USD', 86400, JSON.stringify({ USD: 2500 }));
    expect(redis.del).toHaveBeenCalledWith('price:degraded:ETH-USD');
  });

  it('sirve el valor stale cuando Coinbase falla', async () => {
    redis.get.mockImplementation(async (key: string) =>
      key === 'price:stale:ETH-USD' ? JSON.stringify({ USD: 1900 }) : null,
    );
    coinbase.getTicker.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 1900 });
  });

  it('aplica fallback de 1 USD a stablecoins sin precio ni stale', async () => {
    coinbase.getTicker.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPrice('USDT')).resolves.toEqual({ USD: 1 });
    expect(redis.setEx).toHaveBeenCalledWith('price:degraded:USDT-USD', 30, JSON.stringify({ USD: 1 }));
  });

  it('aplica fallback de 0 a monedas sin precio ni stale', async () => {
    coinbase.getTicker.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 0 });
  });

  it('ignora valores cacheados invalidos', async () => {
    redis.get.mockImplementation(async (key: string) =>
      key === 'price:USDT-USD' ? JSON.stringify({ USD: 0 }) : null,
    );
    coinbase.getTicker.mockRejectedValue(new Error('upstream down'));

    await expect(service.getPrice('USDT')).resolves.toEqual({ USD: 1 });
  });

  it('no llama a Coinbase con identificadores invalidos o no soportados', async () => {
    await expect(service.getPrice('BADCOIN')).resolves.toEqual({ USD: 0 });
    expect(coinbase.getTicker).not.toHaveBeenCalled();
    await expect(service.getPrice('BTC')).resolves.toEqual({ USD: 0 });
    expect(coinbase.getTicker).not.toHaveBeenCalled();
  });

  it('continua funcionando si Redis falla', async () => {
    redis.get.mockRejectedValue(new Error('redis down'));
    redis.setEx.mockRejectedValue(new Error('redis down'));
    redis.del.mockRejectedValue(new Error('redis down'));
    coinbase.getTicker.mockResolvedValue({ price: '2000', bid: '1999', ask: '2001', volume: '1', trade_id: 1, time: '', last_size: '0' });

    await expect(service.getPrice('ETH')).resolves.toEqual({ USD: 2000 });
  });

  it('colapsa peticiones concurrentes de la misma moneda', async () => {
    let resolveFetch: (value: unknown) => void;
    coinbase.getTicker.mockReturnValue(
      new Promise((resolve) => { resolveFetch = resolve; }),
    );

    const first = service.getPrice('ETH');
    const second = service.getPrice('ETH');
    await new Promise((resolve) => setImmediate(resolve));
    resolveFetch!({ price: '2000', bid: '1999', ask: '2001', volume: '1', trade_id: 1, time: '', last_size: '0' });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { USD: 2000 },
      { USD: 2000 },
    ]);
    expect(coinbase.getTicker).toHaveBeenCalledTimes(1);
  });

  it('transforma candles en arreglo de precios', async () => {
    coinbase.getCandles.mockResolvedValue([
      { time: 1, low: 90, high: 110, open: 99, close: 100, volume: 1 },
      { time: 2, low: 99, high: 102, open: 100, close: 101, volume: 1 },
    ]);

    await expect(service.getChart('ETH')).resolves.toEqual({ prices: [100, 101] });
    expect(redis.setEx).toHaveBeenCalledWith('chart:ETH-USD', 300, JSON.stringify({ prices: [100, 101] }));
  });

  it('devuelve landing usando Coinbase', async () => {
    coinbase.getTicker
      .mockResolvedValueOnce({ price: '300', bid: '', ask: '', volume: '', trade_id: 1, time: '', last_size: '' })
      .mockResolvedValueOnce({ price: '2500', bid: '', ask: '', volume: '', trade_id: 1, time: '', last_size: '' })
      .mockResolvedValueOnce({ price: '25', bid: '', ask: '', volume: '', trade_id: 1, time: '', last_size: '' })
      .mockResolvedValueOnce({ price: '0.6', bid: '', ask: '', volume: '', trade_id: 1, time: '', last_size: '' });

    await expect(service.getLanding()).resolves.toEqual({
      bnb: { usd: 300 },
      eth: { usd: 2500 },
      avax: { usd: 25 },
      matic: { usd: 0.6 },
    });
    expect(coinbase.getTicker).toHaveBeenCalledTimes(4);
  });

  it('resuelve productos de Coinbase y rechaza entradas invalidas', () => {
    expect(service.resolveCoinbaseProduct('ETH')).toBe('ETH-USD');
    expect(service.resolveCoinbaseProduct('usdt')).toBe('USDT-USD');
    expect(service.resolveCoinbaseProduct('ETH ')).toBe('ETH-USD');
    expect(service.resolveCoinbaseProduct('BTC')).toBeNull();
    expect(service.resolveCoinbaseProduct('bad coin')).toBeNull();
  });
});
