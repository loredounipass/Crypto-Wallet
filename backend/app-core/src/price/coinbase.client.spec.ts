import { CoinbasePriceClient, CoinbaseUnavailableError } from './coinbase.client';

describe('CoinbasePriceClient', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRICE_MAX_RETRIES = '0';
    process.env.PRICE_RETRY_BASE_DELAY_MS = '0';
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

  it('construye la URL y devuelve ticker', async () => {
    fetchMock.mockResolvedValue(okResponse({ price: '2500', bid: '2499', ask: '2501', volume: '1', trade_id: 1, time: '', last_size: '0' }));
    const client = new CoinbasePriceClient();
    await expect(client.getTicker('ETH-USD')).resolves.toEqual({ price: '2500', bid: '2499', ask: '2501', volume: '1', trade_id: 1, time: '', last_size: '0' });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.exchange.coinbase.com/products/ETH-USD/ticker');
  });

  it('devuelve candles ordenadas cronológicamente', async () => {
    fetchMock.mockResolvedValue(okResponse([[2, 90, 110, 99, 105, 1], [1, 80, 100, 90, 95, 1]]));
    const client = new CoinbasePriceClient();
    const candles = await client.getCandles('ETH-USD', 3600, 2);
    expect(candles).toHaveLength(2);
    expect(candles[0].close).toBe(95);
    expect(candles[1].close).toBe(105);
  });

  it('reintenta en 429 y devuelve la respuesta posterior', async () => {
    process.env.PRICE_MAX_RETRIES = '1';
    fetchMock.mockResolvedValueOnce(errorResponse(429, 'Too Many Requests'))
      .mockResolvedValueOnce(okResponse({ price: '2500', bid: '', ask: '', volume: '', trade_id: 1, time: '', last_size: '' }));
    const client = new CoinbasePriceClient();
    await expect(client.getTicker('ETH-USD')).resolves.toEqual({ price: '2500', bid: '', ask: '', volume: '', trade_id: 1, time: '', last_size: '' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no reintenta errores 4xx no recuperables', async () => {
    process.env.PRICE_MAX_RETRIES = '2';
    fetchMock.mockResolvedValue(errorResponse(400, 'Bad Request'));
    const client = new CoinbasePriceClient();
    await expect(client.getTicker('ETH-USD')).rejects.toBeInstanceOf(CoinbaseUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('convierte errores de red en CoinbaseUnavailableError', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    const client = new CoinbasePriceClient();
    await expect(client.getTicker('ETH-USD')).rejects.toBeInstanceOf(CoinbaseUnavailableError);
  });
});
