import { BinancePriceClient, BinanceUnavailableError } from './binance.client';

describe('BinancePriceClient', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRICE_MAX_RETRIES = '0';
    process.env.PRICE_RETRY_BASE_DELAY_MS = '0';
    delete process.env.COINGECKO_API_KEY;
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  function okResponse(body: unknown) {
    return { ok: true, status: 200, statusText: 'OK', json: async () => body };
  }

  function errorResponse(status: number, statusText = 'Error') {
    return { ok: false, status, statusText, headers: { get: () => null } };
  }

  it('construye la URL y devuelve el precio de Binance', async () => {
    fetchMock.mockResolvedValue(okResponse({ symbol: 'ETHUSDT', price: '2500.00' }));
    const client = new BinancePriceClient();
    await expect(client.getTickerPrice('ETHUSDT')).resolves.toEqual({ symbol: 'ETHUSDT', price: '2500.00' });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
  });

  it('devuelve la lista completa de precios', async () => {
    fetchMock.mockResolvedValue(okResponse([{ symbol: 'BNBUSDT', price: '300' }]));
    const client = new BinancePriceClient();
    await expect(client.getTickerPrices()).resolves.toEqual([{ symbol: 'BNBUSDT', price: '300' }]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.binance.com/api/v3/ticker/price');
  });

  it('transforma klines a objetos tipados', async () => {
    fetchMock.mockResolvedValue(okResponse([['1','100','110','90','105','1','2','1','1','0','0']]));
    const client = new BinancePriceClient();
    const klines = await client.getKlines('ETHUSDT', '1h', 1);
    expect(klines).toHaveLength(1);
    expect(klines[0].close).toBe('105');
  });

  it('reintenta en 429 y devuelve la respuesta posterior', async () => {
    process.env.PRICE_MAX_RETRIES = '1';
    fetchMock.mockResolvedValueOnce(errorResponse(429, 'Too Many Requests'))
      .mockResolvedValueOnce(okResponse({ symbol: 'ETHUSDT', price: '2500' }));
    const client = new BinancePriceClient();
    await expect(client.getTickerPrice('ETHUSDT')).resolves.toEqual({ symbol: 'ETHUSDT', price: '2500' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no reintenta errores 4xx no recuperables', async () => {
    process.env.PRICE_MAX_RETRIES = '2';
    fetchMock.mockResolvedValue(errorResponse(400, 'Bad Request'));
    const client = new BinancePriceClient();
    await expect(client.getTickerPrice('ETHUSDT')).rejects.toBeInstanceOf(BinanceUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('convierte errores de red o timeout en BinanceUnavailableError', async () => {
    fetchMock.mockRejectedValue(new Error('The operation was aborted'));
    const client = new BinancePriceClient();
    await expect(client.getKlines('ETHUSDT')).rejects.toBeInstanceOf(BinanceUnavailableError);
  });
});
