// VALORES POR DEFECTO DEL MODULO DE PRECIOS. SE PUEDEN SOBRESCRIBIR POR VARIABLES DE ENTORNO.
export const DEFAULT_PRICE_CACHE_TTL_SEC = 60;
export const DEFAULT_CHART_CACHE_TTL_SEC = 300;
export const DEFAULT_STALE_CACHE_TTL_SEC = 24 * 60 * 60;
export const DEFAULT_DEGRADED_CACHE_TTL_SEC = 30;
export const DEFAULT_HTTP_TIMEOUT_MS = 3000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_RETRY_BASE_DELAY_MS = 250;
export const MAX_RETRY_DELAY_MS = 5000;

export const COINBASE_BASE_URL = 'https://api.exchange.coinbase.com';

// MONEDAS Y TOKENS SOPORTADOS POR LA APLICACION
export const APP_COINS = Object.freeze(['bnb', 'avax', 's', 'eth', 'matic', 'op', 'usdt', 'usdc'] as const);

// MAPEO DE SIMBOLO DE APP A PRODUCT ID DE COINBASE
export const COINBASE_PRODUCTS: Readonly<Record<string, string>> = Object.freeze({
  bnb: 'BNB-USD',
  avax: 'AVAX-USD',
  s: 'S-USD',
  eth: 'ETH-USD',
  matic: 'MATIC-USD',
  op: 'OP-USD',
  usdt: 'USDT-USD',
  usdc: 'USDC-USD',
});

// STABLECOINS PARA FALLBACK
export const STABLECOIN_PRODUCTS: ReadonlySet<string> = new Set([
  'USDT-USD',
  'USDC-USD',
]);

// LANDING LIMITADA A MONEDAS DE LA APP
export const LANDING_COIN_IDS = ['bnb', 'eth', 'avax', 'matic'] as const;

// LEE UN ENTERO NO NEGATIVO DEL ENTORNO Y APLICA UN VALOR POR DEFECTO SI ES INVALIDO
export function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

// LEE UN BOOLEANO DEL ENTORNO ACEPTANDO FORMATOS HABITUALES
export function readBoolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off'].includes(value)) return false;
  return fallback;
}
